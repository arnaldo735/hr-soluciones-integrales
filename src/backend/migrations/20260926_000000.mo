import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Set "mo:core/Set";
import AccessControl "mo:caffeineai-authorization/access-control";

module {
  type Id = Nat;
  type Timestamp = Int;
  type Money = Nat;

  // ── Tipos de estado existentes (inlined) ────────────────────────────────

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

  type OrderStatus = { #received; #inRepair; #ready; #delivered; #cancelled };

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
    technicianId : ?Id;
    serviceId : ?Id;
  };

  type OrderPhoto = {
    id : Id;
    blob : Blob;
    filename : Text;
    mimeType : Text;
    uploadedBy : Principal;
    uploadedAt : Timestamp;
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
    photos : [OrderPhoto];
    technicianIds : [Id];
    statusHistory : [StatusChange];
    cancelReason : ?Text;
    cancelledAt : ?Timestamp;
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

  type InvoiceLineKind = { #part; #service };

  type InvoiceLine = {
    description : Text;
    quantity : Nat;
    unitPrice : Money;
    amount : Money;
    kind : InvoiceLineKind;
    unitCost : Money;
  };

  type PaymentStatus = { #pending; #paid };
  type PaymentCondition = { #cash; #credit };

  type Installment = {
    number : Nat;
    amount : Money;
    dueDate : Timestamp;
    paid : Bool;
    paidAt : ?Timestamp;
  };

  type InstallmentPlan = {
    installmentCount : Nat;
    firstDueDate : Timestamp;
    installments : [Installment];
  };

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
    taxRate : Nat;
    tax : Money;
    total : Money;
    paymentMethod : PaymentMethod;
    paymentCondition : PaymentCondition;
    paymentStatus : PaymentStatus;
    installments : ?InstallmentPlan;
    issuedAt : Timestamp;
  };

  type BusinessSettings = {
    name : Text;
    taxId : Text;
    address : Text;
    phone : Text;
    taxRate : Nat;
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
    taxRate : Nat;
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

  type ServiceCategory = {
    id : Id;
    name : Text;
    description : Text;
    createdAt : Timestamp;
  };

  type Technician = {
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

  type CommissionLine = {
    orderId : Id;
    orderNumber : Text;
    laborId : Id;
    description : Text;
    serviceId : Id;
    serviceName : Text;
    motorcycleBrand : Text;
    motorcycleModel : Text;
    motorcyclePlate : Text;
    serviceDate : Timestamp;
    technicianId : Id;
    technicianCode : Text;
    technicianName : Text;
    baseAmount : Money;
    commissionRate : Nat;
    commissionAmount : Money;
    at : Timestamp;
  };

  type CommissionPeriod = {
    from : ?Timestamp;
    to : ?Timestamp;
  };

  type CommissionPaymentLoan = {
    loanId : Id;
    amount : Money;
    date : Timestamp;
    note : ?Text;
  };

  type CommissionPayment = {
    id : Id;
    technicianId : Id;
    technicianCode : Text;
    technicianName : Text;
    period : CommissionPeriod;
    lineCount : Nat;
    lines : [CommissionLine];
    baseAmount : Money;
    commissionAmount : Money;
    loans : [CommissionPaymentLoan];
    loansDeducted : Money;
    netPaid : Money;
    paidBy : Principal;
    paidAt : Timestamp;
  };

  type CommissionLineKey = {
    orderId : Id;
    laborId : Id;
  };

  type DocumentType = { #nit; #cedulaCiudadania; #cedulaExtranjeria };
  type FiscalRegime = { #responsableIva; #noResponsableIva };
  type TaxResponsibility = {
    #granContribuyente;
    #autorretenedor;
    #agenteRetencionIva;
    #regimenSimple;
    #noAplica;
  };

  type CompanyProfile = {
    legalName : Text;
    tradeName : ?Text;
    documentType : DocumentType;
    taxId : Text;
    checkDigit : ?Nat;
    fiscalRegime : FiscalRegime;
    taxResponsibility : TaxResponsibility;
    address : Text;
    city : Text;
    phone : Text;
    email : ?Text;
    website : ?Text;
    logoUrl : ?Text;
    taxRate : Nat;
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
    id : Id;
    name : Text;
    description : Text;
    createdAt : Timestamp;
  };

  type Expense = {
    id : Id;
    date : Timestamp;
    concept : Text;
    categoryId : Id;
    categoryName : Text;
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
    taxRate : Nat;
    tax : Money;
    total : Money;
    paymentMethod : Text;
    paymentCondition : PaymentCondition;
    amountReceived : Money;
    change : Money;
    invoiceId : Id;
    soldBy : Principal;
    soldAt : Timestamp;
  };

  type ReceivablePayment = {
    id : Id;
    invoiceId : Id;
    amount : Money;
    method : Text;
    note : ?Text;
    performedBy : Principal;
    at : Timestamp;
  };

  type SupplierOrder = {
    id : Id;
    supplierId : Id;
    quantity : Nat;
    sku : Text;
    description : Text;
    createdBy : Principal;
    createdAt : Timestamp;
  };

  type Counters = {
    var nextPartId : Nat;
    var nextLotId : Nat;
    var nextMovementId : Nat;
    var nextCustomerId : Nat;
    var nextMotorcycleId : Nat;
    var nextOrderId : Nat;
    var nextOrderPartId : Nat;
    var nextLaborId : Nat;
    var nextOrderPhotoId : Nat;
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
    var nextServiceCategoryId : Nat;
    var nextTechnicianId : Nat;
    var nextTechnicianLoanId : Nat;
    var nextCommissionPaymentId : Nat;
    var nextAppointmentId : Nat;
    var nextExpenseId : Nat;
    var nextExpenseCategoryId : Nat;
    var nextPosSaleId : Nat;
    var nextPosSaleNumber : Nat;
    var nextReceivablePaymentId : Nat;
    var nextSupplierOrderId : Nat;
  };

  // ── Nuevo estado: credenciales OAuth de Google Drive ────────────────────

  type DriveCredentials = {
    var refreshToken : Text;
    var accessToken : ?Text;
    var accessTokenExpiresAt : ?Int;
    var accountEmail : ?Text;
    var connectedAt : Timestamp;
  };

  type OldActor = {
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
    quotes : Map.Map<Id, Quote>;
    services : Map.Map<Id, Service>;
    serviceCategories : Map.Map<Id, ServiceCategory>;
    technicians : Map.Map<Id, Technician>;
    technicianLoans : Map.Map<Id, TechnicianLoan>;
    commissionPayments : Map.Map<Id, CommissionPayment>;
    paidCommissionLines : Set.Set<CommissionLineKey>;
    company : { var profile : CompanyProfile };
    appointments : Map.Map<Id, Appointment>;
    expenses : Map.Map<Id, Expense>;
    expenseCategories : Map.Map<Id, ExpenseCategory>;
    posSales : Map.Map<Id, PosSale>;
    receivablePayments : Map.Map<Id, ReceivablePayment>;
    supplierOrders : Map.Map<Id, SupplierOrder>;
    counters : Counters;
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
    quotes : Map.Map<Id, Quote>;
    services : Map.Map<Id, Service>;
    serviceCategories : Map.Map<Id, ServiceCategory>;
    technicians : Map.Map<Id, Technician>;
    technicianLoans : Map.Map<Id, TechnicianLoan>;
    commissionPayments : Map.Map<Id, CommissionPayment>;
    paidCommissionLines : Set.Set<CommissionLineKey>;
    company : { var profile : CompanyProfile };
    appointments : Map.Map<Id, Appointment>;
    expenses : Map.Map<Id, Expense>;
    expenseCategories : Map.Map<Id, ExpenseCategory>;
    posSales : Map.Map<Id, PosSale>;
    receivablePayments : Map.Map<Id, ReceivablePayment>;
    supplierOrders : Map.Map<Id, SupplierOrder>;
    counters : Counters;
    driveCredentials : { var credentials : ?DriveCredentials };
  };

  public func migration(old : OldActor) : NewActor {
    {
      accessControlState = old.accessControlState;
      parts = old.parts;
      lots = old.lots;
      movements = old.movements;
      customers = old.customers;
      motorcycles = old.motorcycles;
      orders = old.orders;
      suppliers = old.suppliers;
      purchases = old.purchases;
      payments = old.payments;
      invoices = old.invoices;
      businessSettings = old.businessSettings;
      userProfiles = old.userProfiles;
      quotes = old.quotes;
      services = old.services;
      serviceCategories = old.serviceCategories;
      technicians = old.technicians;
      technicianLoans = old.technicianLoans;
      commissionPayments = old.commissionPayments;
      paidCommissionLines = old.paidCommissionLines;
      company = old.company;
      appointments = old.appointments;
      expenses = old.expenses;
      expenseCategories = old.expenseCategories;
      posSales = old.posSales;
      receivablePayments = old.receivablePayments;
      supplierOrders = old.supplierOrders;
      counters = old.counters;
      driveCredentials = { var credentials = null };
    };
  };
};
