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
  // import from `mo:core/...` or mops packages.

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

  type OldOrderStatus = { #received; #inRepair; #ready; #delivered };

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

  type StatusChange = {
    from : ?OldOrderStatus;
    to : OldOrderStatus;
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
    status : OldOrderStatus;
    parts : [OrderPart];
    labor : [LaborItem];
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

  type OldInvoiceLine = {
    description : Text;
    quantity : Nat;
    unitPrice : Money;
    amount : Money;
  };

  type PaymentStatus = { #pending; #paid };

  type InvoiceOrigin = { #workshopOrder; #pos; #quote };

  type OldInvoice = {
    id : Id;
    number : Text;
    origin : InvoiceOrigin;
    orderId : ?Id;
    posSaleId : ?Id;
    customerId : ?Id;
    customerName : Text;
    customerTaxId : ?Text;
    customerAddress : ?Text;
    lines : [OldInvoiceLine];
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

  type OldCommissionPayment = {
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

  type DocumentType = {
    #nit;
    #cedulaCiudadania;
    #cedulaExtranjeria;
  };

  type FiscalRegime = {
    #responsableIva;
    #noResponsableIva;
  };

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

  type OldPosSale = {
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
    var nextServiceCategoryId : Nat;
    var nextTechnicianId : Nat;
    var nextTechnicianLoanId : Nat;
    var nextCommissionPaymentId : Nat;
    var nextAppointmentId : Nat;
    var nextExpenseId : Nat;
    var nextPosSaleId : Nat;
    var nextPosSaleNumber : Nat;
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
    invoices : Map.Map<Id, OldInvoice>;
    businessSettings : { var settings : BusinessSettings };
    userProfiles : Map.Map<Principal, UserProfile>;
    quotes : Map.Map<Id, Quote>;
    services : Map.Map<Id, Service>;
    serviceCategories : Map.Map<Id, ServiceCategory>;
    technicians : Map.Map<Id, Technician>;
    technicianLoans : Map.Map<Id, TechnicianLoan>;
    commissionPayments : Map.Map<Id, OldCommissionPayment>;
    paidCommissionLines : Set.Set<CommissionLineKey>;
    company : { var profile : CompanyProfile };
    appointments : Map.Map<Id, Appointment>;
    expenses : Map.Map<Id, Expense>;
    posSales : Map.Map<Id, OldPosSale>;
    counters : OldCounters;
  };

  // ── New state ───────────────────────────────────────────────────────────

  type OrderStatus = { #received; #inRepair; #ready; #delivered; #cancelled };

  type OrderPhoto = {
    id : Id;
    blob : Blob;
    filename : Text;
    mimeType : Text;
    uploadedBy : Principal;
    uploadedAt : Timestamp;
  };

  type NewStatusChange = {
    from : ?OrderStatus;
    to : OrderStatus;
    performedBy : Principal;
    at : Timestamp;
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
    labor : [LaborItem];
    photos : [OrderPhoto];
    technicianIds : [Id];
    statusHistory : [NewStatusChange];
    cancelReason : ?Text;
    cancelledAt : ?Timestamp;
    createdAt : Timestamp;
    updatedAt : Timestamp;
  };

  type InvoiceLineKind = { #part; #service };

  type NewInvoiceLine = {
    description : Text;
    quantity : Nat;
    unitPrice : Money;
    amount : Money;
    kind : InvoiceLineKind;
    unitCost : Money;
  };

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
    lines : [NewInvoiceLine];
    subtotal : Money;
    discount : Money;
    taxRate : TaxRate;
    tax : Money;
    total : Money;
    paymentMethod : PaymentMethod;
    paymentCondition : PaymentCondition;
    paymentStatus : PaymentStatus;
    installments : ?InstallmentPlan;
    issuedAt : Timestamp;
  };

  type NewPosSale = {
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
    paymentCondition : PaymentCondition;
    amountReceived : Money;
    change : Money;
    invoiceId : Id;
    soldBy : Principal;
    soldAt : Timestamp;
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

  type NewCommissionPayment = {
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

  type NewCounters = {
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
    var nextPosSaleId : Nat;
    var nextPosSaleNumber : Nat;
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
    serviceCategories : Map.Map<Id, ServiceCategory>;
    technicians : Map.Map<Id, Technician>;
    technicianLoans : Map.Map<Id, TechnicianLoan>;
    commissionPayments : Map.Map<Id, NewCommissionPayment>;
    paidCommissionLines : Set.Set<CommissionLineKey>;
    company : { var profile : CompanyProfile };
    appointments : Map.Map<Id, Appointment>;
    expenses : Map.Map<Id, Expense>;
    posSales : Map.Map<Id, NewPosSale>;
    counters : NewCounters;
  };

  public func migration(old : OldActor) : NewActor {
    // Las órdenes existentes no tienen fotos ni cancelación; se conservan sus
    // líneas y su historial de estados.
    let orders = old.orders.map<Id, OldWorkshopOrder, NewWorkshopOrder>(
      func(_, order) {
        {
          order with
          photos = [];
          statusHistory = order.statusHistory.map(
            func(change) { { change with from = change.from; to = change.to } }
          );
          cancelReason = null;
          cancelledAt = null;
        };
      }
    );

    // Las facturas existentes son de contado y sin plan de cuotas. Sus líneas
    // se marcan como repuesto por defecto (el desglose de utilidad solo aplica
    // a facturas nuevas).
    let invoices = old.invoices.map<Id, OldInvoice, NewInvoice>(
      func(_, invoice) {
        {
          invoice with
          lines = invoice.lines.map(
            func(line) { { line with kind = #part; unitCost = 0 } }
          );
          paymentCondition = #cash;
          installments = null;
        };
      }
    );

    // Las ventas de mostrador existentes fueron de contado.
    let posSales = old.posSales.map<Id, OldPosSale, NewPosSale>(
      func(_, sale) { { sale with paymentCondition = #cash } }
    );

    // Los comprobantes de pago existentes no guardaban el desglose de líneas.
    let commissionPayments = old.commissionPayments.map<Id, OldCommissionPayment, NewCommissionPayment>(
      func(_, payment) { { payment with lines = [] } }
    );

    let counters : NewCounters = {
      var nextPartId = old.counters.nextPartId;
      var nextLotId = old.counters.nextLotId;
      var nextMovementId = old.counters.nextMovementId;
      var nextCustomerId = old.counters.nextCustomerId;
      var nextMotorcycleId = old.counters.nextMotorcycleId;
      var nextOrderId = old.counters.nextOrderId;
      var nextOrderPartId = old.counters.nextOrderPartId;
      var nextLaborId = old.counters.nextLaborId;
      var nextOrderPhotoId = 0;
      var nextSupplierId = old.counters.nextSupplierId;
      var nextPurchaseId = old.counters.nextPurchaseId;
      var nextPurchaseItemId = old.counters.nextPurchaseItemId;
      var nextPaymentId = old.counters.nextPaymentId;
      var nextInvoiceId = old.counters.nextInvoiceId;
      var nextInvoiceNumber = old.counters.nextInvoiceNumber;
      var nextQuoteId = old.counters.nextQuoteId;
      var nextQuoteNumber = old.counters.nextQuoteNumber;
      var nextQuotePartLineId = old.counters.nextQuotePartLineId;
      var nextQuoteServiceLineId = old.counters.nextQuoteServiceLineId;
      var nextServiceId = old.counters.nextServiceId;
      var nextServiceCategoryId = old.counters.nextServiceCategoryId;
      var nextTechnicianId = old.counters.nextTechnicianId;
      var nextTechnicianLoanId = old.counters.nextTechnicianLoanId;
      var nextCommissionPaymentId = old.counters.nextCommissionPaymentId;
      var nextAppointmentId = old.counters.nextAppointmentId;
      var nextExpenseId = old.counters.nextExpenseId;
      var nextPosSaleId = old.counters.nextPosSaleId;
      var nextPosSaleNumber = old.counters.nextPosSaleNumber;
    };

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
      invoices;
      businessSettings = old.businessSettings;
      userProfiles = old.userProfiles;
      quotes = old.quotes;
      services = old.services;
      serviceCategories = old.serviceCategories;
      technicians = old.technicians;
      technicianLoans = old.technicianLoans;
      commissionPayments;
      paidCommissionLines = old.paidCommissionLines;
      company = old.company;
      appointments = old.appointments;
      expenses = old.expenses;
      posSales;
      counters;
    };
  };
};
