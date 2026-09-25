import List "mo:core/List";
import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Set "mo:core/Set";
import Time "mo:core/Time";
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
    var nextPosSaleId : Nat;
    var nextPosSaleNumber : Nat;
  };

  // ── Nuevos tipos de estado ──────────────────────────────────────────────

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
    posSales : Map.Map<Id, PosSale>;
    counters : Counters;
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
    var nextReceivablePaymentId : Nat;
    var nextSupplierOrderId : Nat;
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
    posSales : Map.Map<Id, PosSale>;
    receivablePayments : Map.Map<Id, ReceivablePayment>;
    supplierOrders : Map.Map<Id, SupplierOrder>;
    counters : NewCounters;
  };

  // ── Datos de muestra ────────────────────────────────────────────────────
  // Conjunto de datos coherente para recorrer los tres flujos (cuentas por
  // cobrar, cuentas por pagar y comisiones) en una app recién instalada. Se
  // siembra una sola vez, desde esta migración (el único punto de
  // inicialización de estado de este proyecto), y es idempotente: si ya hay
  // técnicos o servicios, no se duplica nada. Los montos van en centavos
  // enteros.

  // Un día en nanosegundos (literal: un `let` de módulo debe ser estático).
  let dayNs : Int = 86_400_000_000_000;

  // Siembra el catálogo base (técnicos, servicios, cliente, moto, proveedor)
  // solo cuando las colecciones relevantes están vacías. Devuelve los ids
  // creados para encadenar la orden, la factura y la compra.
  func seedCatalog(
    now : Timestamp,
    parts : Map.Map<Id, Part>,
    services : Map.Map<Id, Service>,
    technicians : Map.Map<Id, Technician>,
    customers : Map.Map<Id, Customer>,
    motorcycles : Map.Map<Id, Motorcycle>,
    suppliers : Map.Map<Id, Supplier>,
    counters : NewCounters,
  ) : () {
    if (parts.size() == 0) {
      let partId = counters.nextPartId;
      counters.nextPartId := partId + 1;
      parts.add(partId, {
        id = partId;
        sku = "REP-001";
        name = "Filtro de aceite";
        category = "Filtros";
        brand = "Genérico";
        unit = "Unidad";
        salePrice = 2500000;
        costPrice = 1500000;
        lowStockThreshold = 5;
        createdAt = now;
      });
    };

    if (technicians.size() == 0) {
      let t1 : Technician = {
        id = counters.nextTechnicianId;
        code = "TEC-001";
        name = "Ana Gómez";
        phone = "3001234567";
        email = ?"ana.gomez@taller.co";
        specialty = "Mecánica general";
        hourlyRate = 2500000;
        commissionRate = 10;
        active = true;
        createdAt = now;
      };
      counters.nextTechnicianId := t1.id + 1;
      technicians.add(t1.id, t1);

      let t2 : Technician = {
        id = counters.nextTechnicianId;
        code = "TEC-002";
        name = "Carlos Ruiz";
        phone = "3009876543";
        email = ?"carlos.ruiz@taller.co";
        specialty = "Sistemas eléctricos";
        hourlyRate = 3000000;
        commissionRate = 15;
        active = true;
        createdAt = now;
      };
      counters.nextTechnicianId := t2.id + 1;
      technicians.add(t2.id, t2);
    };

    if (services.size() == 0) {
      let catalog : [(Text, Text, Text, Money, Nat)] = [
        ("SRV-001", "Cambio de aceite", "Mantenimiento", 4500000, 30),
        ("SRV-002", "Ajuste de frenos", "Frenos", 6000000, 45),
        ("SRV-003", "Sincronización de motor", "Motor", 12000000, 90),
        ("SRV-004", "Cambio de llanta", "Llantas", 3500000, 25),
        ("SRV-005", "Diagnóstico eléctrico", "Servicio de terceros", 8000000, 60),
      ];
      for ((code, name, category, laborRate, minutes) in catalog.values()) {
        let id = counters.nextServiceId;
        counters.nextServiceId := id + 1;
        services.add(id, {
          id;
          code;
          name;
          description = name;
          category;
          laborRate;
          estimatedMinutes = minutes;
          active = true;
          createdAt = now;
        });
      };
    };

    if (customers.size() == 0) {
      let customerId = counters.nextCustomerId;
      counters.nextCustomerId := customerId + 1;
      customers.add(customerId, {
        id = customerId;
        name = "Juan Pérez";
        phone = "3105557788";
        email = ?"juan.perez@correo.co";
        document = ?"1020304050";
        address = ?"Calle 45 #12-30, Bogotá";
        createdAt = now;
      });

      let motorcycleId = counters.nextMotorcycleId;
      counters.nextMotorcycleId := motorcycleId + 1;
      motorcycles.add(motorcycleId, {
        id = motorcycleId;
        customerId;
        plate = "ABC12D";
        brand = "Yamaha";
        model = "FZ 2.0";
        year = 2021;
        mileage = 18500;
        createdAt = now;
      });
    };

    if (suppliers.size() == 0) {
      let supplierId = counters.nextSupplierId;
      counters.nextSupplierId := supplierId + 1;
      suppliers.add(supplierId, {
        id = supplierId;
        name = "Repuestos El Motor S.A.S.";
        contactName = ?"Marta López";
        phone = "6017654321";
        email = ?"ventas@repuestoselmotor.co";
        taxId = ?"900123456-7";
        address = ?"Carrera 68 #22-10, Bogotá";
        createdAt = now;
      });
    };
  };

  // Siembra una OT entregada con mano de obra vinculada al catálogo (una
  // línea comisionable y una de "Servicio de terceros" que no comisiona) y una
  // línea libre sin servicio. Solo se crea si no hay órdenes.
  func seedDeliveredOrder(
    now : Timestamp,
    orders : Map.Map<Id, WorkshopOrder>,
    services : Map.Map<Id, Service>,
    technicians : Map.Map<Id, Technician>,
    customers : Map.Map<Id, Customer>,
    motorcycles : Map.Map<Id, Motorcycle>,
    counters : NewCounters,
  ) : () {
    if (orders.size() > 0) { return };
    let customer = switch (customers.values().next()) {
      case (?c) { c };
      case null { return };
    };
    let motorcycle = switch (motorcycles.values().next()) {
      case (?m) { m };
      case null { return };
    };
    let technician = switch (technicians.values().next()) {
      case (?t) { t };
      case null { return };
    };

    // Servicio comisionable: primera categoría distinta de "Servicio de
    // terceros". Servicio de terceros: el de esa categoría.
    var commissionable : ?Service = null;
    var thirdParty : ?Service = null;
    for (service in services.values()) {
      if (service.category == "Servicio de terceros") {
        thirdParty := ?service;
      } else {
        switch (commissionable) {
          case null { commissionable := ?service };
          case (?_) {};
        };
      };
    };

    let orderId = counters.nextOrderId;
    counters.nextOrderId := orderId + 1;

    let labor = List.empty<LaborItem>();
    switch (commissionable) {
      case (?service) {
        let laborId = counters.nextLaborId;
        counters.nextLaborId := laborId + 1;
        labor.add({
          id = laborId;
          description = service.name;
          price = service.laborRate;
          technicianId = ?technician.id;
          serviceId = ?service.id;
        });
      };
      case null {};
    };
    switch (thirdParty) {
      case (?service) {
        let laborId = counters.nextLaborId;
        counters.nextLaborId := laborId + 1;
        labor.add({
          id = laborId;
          description = service.name;
          price = service.laborRate;
          technicianId = ?technician.id;
          serviceId = ?service.id;
        });
      };
      case null {};
    };
    // Línea libre: sin servicio de catálogo, no genera comisión.
    let freeLaborId = counters.nextLaborId;
    counters.nextLaborId := freeLaborId + 1;
    labor.add({
      id = freeLaborId;
      description = "Revisión general de la moto";
      price = 2000000;
      technicianId = ?technician.id;
      serviceId = null;
    });

    let order : WorkshopOrder = {
      id = orderId;
      orderNumber = "OT-000001";
      customerId = customer.id;
      motorcycleId = motorcycle.id;
      intakeMileage = motorcycle.mileage;
      problem = "Mantenimiento preventivo y revisión de frenos";
      status = #delivered;
      parts = [];
      labor = labor.toArray();
      photos = [];
      technicianIds = [technician.id];
      statusHistory = [
        { from = null; to = #received; performedBy = Principal.fromText("aaaaa-aa"); at = now },
        { from = ?#received; to = #inRepair; performedBy = Principal.fromText("aaaaa-aa"); at = now },
        { from = ?#inRepair; to = #ready; performedBy = Principal.fromText("aaaaa-aa"); at = now },
        { from = ?#ready; to = #delivered; performedBy = Principal.fromText("aaaaa-aa"); at = now },
      ];
      cancelReason = null;
      cancelledAt = null;
      createdAt = now;
      updatedAt = now;
    };
    orders.add(orderId, order);
  };

  // Siembra una factura a crédito con plan de cuotas (origen venta de
  // mostrador) para poblar cuentas por cobrar. La primera cuota vence en 15
  // días, de modo que la cuenta aparece pendiente y no vencida. Solo se crea
  // si no hay facturas.
  func seedCreditInvoice(
    now : Timestamp,
    invoices : Map.Map<Id, Invoice>,
    customers : Map.Map<Id, Customer>,
    counters : NewCounters,
  ) : () {
    if (invoices.size() > 0) { return };
    let customer = switch (customers.values().next()) {
      case (?c) { c };
      case null { return };
    };

    let lines : [InvoiceLine] = [
      {
        description = "Cambio de aceite";
        quantity = 1;
        unitPrice = 4500000;
        amount = 4500000;
        kind = #service;
        unitCost = 0;
      },
      {
        description = "Ajuste de frenos";
        quantity = 1;
        unitPrice = 6000000;
        amount = 6000000;
        kind = #service;
        unitCost = 0;
      },
    ];
    let subtotal = 10500000;
    let total = 10500000;
    let count = 3;
    let base = total / count;
    let remainder = total % count;
    let firstDueDate = now + (15 * dayNs);
    let installments = List.empty<Installment>();
    var index = 0;
    while (index < count) {
      installments.add({
        number = index + 1;
        amount = if (index < remainder) { base + 1 } else { base };
        dueDate = firstDueDate + (index * 30 * dayNs);
        paid = false;
        paidAt = null;
      });
      index += 1;
    };

    let id = counters.nextInvoiceId;
    counters.nextInvoiceId := id + 1;
    let number = "F-000001";
    counters.nextInvoiceNumber := counters.nextInvoiceNumber + 1;
    invoices.add(id, {
      id;
      number;
      origin = #pos;
      orderId = null;
      posSaleId = null;
      customerId = ?customer.id;
      customerName = customer.name;
      customerTaxId = customer.document;
      customerAddress = customer.address;
      lines;
      subtotal;
      discount = 0;
      taxRate = 0;
      tax = 0;
      total;
      paymentMethod = #cash;
      paymentCondition = #credit;
      paymentStatus = #pending;
      installments = ?{
        installmentCount = count;
        firstDueDate;
        installments = installments.toArray();
      };
      issuedAt = now;
    });
  };

  // Siembra una compra pendiente a proveedor para poblar cuentas por pagar.
  // Solo se crea si no hay compras.
  func seedPendingPurchase(
    now : Timestamp,
    purchases : Map.Map<Id, Purchase>,
    suppliers : Map.Map<Id, Supplier>,
    parts : Map.Map<Id, Part>,
    counters : NewCounters,
  ) : () {
    if (purchases.size() > 0) { return };
    let supplier = switch (suppliers.values().next()) {
      case (?s) { s };
      case null { return };
    };
    let part = switch (parts.values().next()) {
      case (?p) { p };
      case null { return };
    };
    let itemId = counters.nextPurchaseItemId;
    counters.nextPurchaseItemId := itemId + 1;
    let items : [PurchaseItem] = [
      {
        id = itemId;
        partId = part.id;
        lotNumber = "LOTE-DEMO-01";
        quantity = 10;
        unitCost = 1500000;
      },
    ];
    let purchaseId = counters.nextPurchaseId;
    counters.nextPurchaseId := purchaseId + 1;
    purchases.add(purchaseId, {
      id = purchaseId;
      supplierId = supplier.id;
      items;
      total = 15000000;
      paidAmount = 0;
      createdAt = now;
    });
  };

  public func migration(old : OldActor) : NewActor {
    let counters : NewCounters = {
      var nextPartId = old.counters.nextPartId;
      var nextLotId = old.counters.nextLotId;
      var nextMovementId = old.counters.nextMovementId;
      var nextCustomerId = old.counters.nextCustomerId;
      var nextMotorcycleId = old.counters.nextMotorcycleId;
      var nextOrderId = old.counters.nextOrderId;
      var nextOrderPartId = old.counters.nextOrderPartId;
      var nextLaborId = old.counters.nextLaborId;
      var nextOrderPhotoId = old.counters.nextOrderPhotoId;
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
      var nextReceivablePaymentId = 0;
      var nextSupplierOrderId = 0;
    };

    // Los datos de muestra se siembran una sola vez, aquí, sobre las
    // colecciones heredadas. Cada sembrador se guarda por vacuidad, así que
    // una instalación con datos no se duplica.
    let now = Time.now();
    seedCatalog(now, old.parts, old.services, old.technicians, old.customers, old.motorcycles, old.suppliers, counters);
    seedDeliveredOrder(now, old.orders, old.services, old.technicians, old.customers, old.motorcycles, counters);
    seedCreditInvoice(now, old.invoices, old.customers, counters);
    seedPendingPurchase(now, old.purchases, old.suppliers, old.parts, counters);

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
      posSales = old.posSales;
      receivablePayments = Map.empty();
      supplierOrders = Map.empty();
      counters;
    };
  };
};
