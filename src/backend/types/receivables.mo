import Common "common";

module {
  public type Id = Common.Id;
  public type Timestamp = Common.Timestamp;
  public type Money = Common.Money;

  // Estado de una cuenta por cobrar derivada de una factura a crédito.
  // `#pending` = saldo pendiente y aún no vencida; `#overdue` = saldo
  // pendiente con vencimiento pasado; `#paid` = sin saldo pendiente.
  public type ReceivableStatus = { #pending; #overdue; #paid };

  // Fila de una cuenta por cobrar. Se deriva de una factura a crédito: el
  // saldo pendiente es el total de la factura menos los abonos registrados.
  public type Receivable = {
    invoiceId : Id;
    invoiceNumber : Text;
    customerId : ?Id;
    customerName : Text;
    total : Money;
    paidAmount : Money;
    balance : Money;
    dueDate : Timestamp;
    status : ReceivableStatus;
    issuedAt : Timestamp;
  };

  // Resumen superior del módulo de cuentas por cobrar.
  public type ReceivableSummary = {
    totalOutstanding : Money;
    totalOverdue : Money;
    openCount : Nat;
  };

  public type ReceivableFilter = {
    status : ?ReceivableStatus;
    search : ?Text;
  };

  // Abono sobre una cuenta por cobrar. `amount` es el valor abonado; el saldo
  // pendiente y el estado de la factura se recalculan.
  public type ReceivablePaymentInput = {
    invoiceId : Id;
    amount : Money;
    method : Text;
    note : ?Text;
  };

  public type ReceivablePayment = {
    id : Id;
    invoiceId : Id;
    amount : Money;
    method : Text;
    note : ?Text;
    performedBy : Principal;
    at : Timestamp;
  };

  public type ReceivableError = {
    #notFound : Id;
    #notCredit;
    #invalidAmount;
    #overpayment : { balance : Money; amount : Money };
    #notAuthorized;
  };
};
