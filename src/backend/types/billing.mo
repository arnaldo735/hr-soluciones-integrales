import Common "common";

module {
  public type Id = Common.Id;
  public type Timestamp = Common.Timestamp;
  public type Money = Common.Money;
  public type TaxRate = Common.TaxRate;

  public type BusinessSettings = {
    name : Text;
    taxId : Text;
    address : Text;
    phone : Text;
    taxRate : TaxRate;
  };

  // Naturaleza de una línea de factura: repuesto o servicio. Permite al
  // reporte contable separar la utilidad de repuestos de la de servicios.
  public type InvoiceLineKind = { #part; #service };

  public type InvoiceLine = {
    description : Text;
    quantity : Nat;
    unitPrice : Money;
    amount : Money;
    kind : InvoiceLineKind;
    // Costo unitario de referencia de la línea (costo del repuesto o de la
    // mano de obra). 0 cuando no aplica. Se usa para calcular el margen.
    unitCost : Money;
  };

  public type PaymentMethod = { #cash; #card; #transfer; #mixed };

  public type PaymentStatus = { #pending; #paid };

  // Condición de pago de una factura: de contado o a crédito con cuotas.
  public type PaymentCondition = { #cash; #credit };

  // Una cuota del plan de crédito. `amount` es el valor de la cuota y
  // `dueDate` su fecha de vencimiento. `paid` indica si ya se registró su pago.
  public type Installment = {
    number : Nat;
    amount : Money;
    dueDate : Timestamp;
    paid : Bool;
    paidAt : ?Timestamp;
  };

  // Plan de cuotas de una factura a crédito. `installmentCount` es el número
  // de cuotas y `firstDueDate` la fecha de la primera cuota.
  public type InstallmentPlan = {
    installmentCount : Nat;
    firstDueDate : Timestamp;
    installments : [Installment];
  };

  // Origen de la factura: una orden de taller o una venta directa de
  // mostrador (POS). `#pos` no tiene orden asociada.
  public type InvoiceOrigin = { #workshopOrder; #pos; #quote };

  public type Invoice = {
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

  // Entrada del plan de cuotas al generar una factura a crédito.
  public type CreditPlanInput = {
    installmentCount : Nat;
    firstDueDate : Timestamp;
  };

  public type InvoiceFilter = {
    search : ?Text;
    from : ?Timestamp;
    to : ?Timestamp;
  };

  public type InvoicePage = {
    items : [Invoice];
    total : Nat;
    offset : Nat;
    limit : Nat;
  };

  public type BillingError = {
    #notFound : Id;
    #orderNotBillable : Id;
    #notAuthorized;
  };
};
