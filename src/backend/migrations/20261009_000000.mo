import Map "mo:core/Map";
import Principal "mo:core/Principal";

module {
  type Id = Nat;
  type Timestamp = Int;
  type Money = Nat;
  type TaxRate = Nat;

  // ── Tipos heredados (inlined; las migraciones no importan módulos del proyecto) ──

  type PaymentMethod = { #cash; #card; #transfer; #mixed };
  type PaymentStatus = { #pending; #paid };
  type PaymentCondition = { #cash; #credit };
  type InvoiceOrigin = { #workshopOrder; #pos; #quote };
  type InvoiceLineKind = { #part; #service };
  type CashAccount = { #cash; #bank };
  type CashMovementKind = { #income; #expense };

  type InvoiceLine = {
    description : Text;
    quantity : Nat;
    unitPrice : Money;
    amount : Money;
    kind : InvoiceLineKind;
    unitCost : Money;
  };

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

  type StatusChange = {
    from : ?OrderStatus;
    to : OrderStatus;
    performedBy : Principal;
    at : Timestamp;
  };

  // `Storage.ExternalBlob` es un alias de `Blob`; se inlinea como `Blob`
  // porque las migraciones no importan módulos del proyecto.
  type OrderPhoto = {
    id : Id;
    blob : Blob;
    filename : Text;
    mimeType : Text;
    uploadedBy : Principal;
    uploadedAt : Timestamp;
  };

  // Forma anterior de la orden: sin anticipo.
  type OldOrder = {
    id : Id;
    orderNumber : Text;
    customerId : Id;
    motorcycleId : Id;
    intakeMileage : Nat;
    previousMileage : ?Nat;
    oilChangeInterval : ?Nat;
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

  // Forma anterior de la factura: sin anticipo aplicado.
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
    lines : [InvoiceLine];
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

  // ── Tipos nuevos ────────────────────────────────────────────────────────

  type OrderAdvance = {
    amount : Money;
    method : PaymentMethod;
    registeredAt : Timestamp;
    registeredBy : Principal;
  };

  // Origen del movimiento de tesorería antes de agregar `#advance`.
  type OldCashMovementSource = {
    #manual;
    #invoice;
    #receivable;
    #purchase;
    #expense;
    #commission;
    #pos;
    #other;
  };

  // Origen del movimiento de tesorería con el nuevo caso `#advance`.
  type NewCashMovementSource = {
    #manual;
    #invoice;
    #receivable;
    #purchase;
    #expense;
    #commission;
    #pos;
    #advance;
    #other;
  };

  type OldCashMovement = {
    id : Id;
    shiftId : Id;
    timestamp : Timestamp;
    kind : CashMovementKind;
    paymentMethod : PaymentMethod;
    amount : Money;
    account : CashAccount;
    description : Text;
    reference : ?Text;
    source : OldCashMovementSource;
  };

  type NewCashMovement = {
    id : Id;
    shiftId : Id;
    timestamp : Timestamp;
    kind : CashMovementKind;
    paymentMethod : PaymentMethod;
    amount : Money;
    account : CashAccount;
    description : Text;
    reference : ?Text;
    source : NewCashMovementSource;
  };

  type NewOrder = {
    id : Id;
    orderNumber : Text;
    customerId : Id;
    motorcycleId : Id;
    intakeMileage : Nat;
    previousMileage : ?Nat;
    oilChangeInterval : ?Nat;
    problem : Text;
    status : OrderStatus;
    parts : [OrderPart];
    labor : [LaborItem];
    photos : [OrderPhoto];
    technicianIds : [Id];
    statusHistory : [StatusChange];
    cancelReason : ?Text;
    cancelledAt : ?Timestamp;
    advance : ?OrderAdvance;
    createdAt : Timestamp;
    updatedAt : Timestamp;
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
    lines : [InvoiceLine];
    subtotal : Money;
    discount : Money;
    taxRate : TaxRate;
    tax : Money;
    total : Money;
    advanceApplied : ?Money;
    paymentMethod : PaymentMethod;
    paymentCondition : PaymentCondition;
    paymentStatus : PaymentStatus;
    installments : ?InstallmentPlan;
    issuedAt : Timestamp;
  };

  // ── Estado anterior ─────────────────────────────────────────────────────
  // Forma parcial: solo se declaran los campos que la migración transforma
  // (`orders`, `invoices` y `cashMovements`). El resto del estado del actor se
  // hereda automáticamente.
  type OldActor = {
    orders : Map.Map<Id, OldOrder>;
    invoices : Map.Map<Id, OldInvoice>;
    cashMovements : Map.Map<Id, OldCashMovement>;
  };

  // ── Estado nuevo ────────────────────────────────────────────────────────
  // `orders`, `invoices` y `cashMovements` cambian de forma; los campos no
  // listados se heredan automáticamente.
  type NewActor = {
    orders : Map.Map<Id, NewOrder>;
    invoices : Map.Map<Id, NewInvoice>;
    cashMovements : Map.Map<Id, NewCashMovement>;
  };

  public func migration(old : OldActor) : NewActor {
    // Las órdenes existentes no tenían anticipo: quedan con `advance = null`.
    let orders = old.orders.map<Id, OldOrder, NewOrder>(
      func(_id, order) {
        {
          order with
          advance = null;
        };
      }
    );

    // Las facturas existentes no aplicaron anticipo: quedan con
    // `advanceApplied = null`.
    let invoices = old.invoices.map<Id, OldInvoice, NewInvoice>(
      func(_id, invoice) {
        {
          invoice with
          advanceApplied = null;
        };
      }
    );

    // Los movimientos existentes conservan su origen; el nuevo caso
    // `#advance` solo lo producen los anticipos registrados a partir de ahora.
    let cashMovements = old.cashMovements.map<Id, OldCashMovement, NewCashMovement>(
      func(_id, movement) {
        {
          movement with
          source = movement.source : NewCashMovementSource;
        };
      }
    );

    { orders; invoices; cashMovements };
  };
};
