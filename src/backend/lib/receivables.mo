import List "mo:core/List";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";

import Common "../types/common";
import Types "../types/receivables";
import BillingTypes "../types/billing";
import Search "../lib/search";

module {
  public type Counters = {
    var nextReceivablePaymentId : Nat;
  };

  public type State = {
    invoices : Map.Map<Common.Id, BillingTypes.Invoice>;
    receivablePayments : Map.Map<Common.Id, Types.ReceivablePayment>;
    counters : Counters;
  };

  // --- helpers -------------------------------------------------------------

  func matches(haystack : Text, needle : Text) : Bool {
    Search.contains(haystack, needle);
  };

  // Suma de los abonos registrados sobre una factura.
  func paidFor(state : State, invoiceId : Common.Id) : Common.Money {
    var total = 0;
    for (payment in state.receivablePayments.values()) {
      if (payment.invoiceId == invoiceId) { total += payment.amount };
    };
    total;
  };

  // Vencimiento de una factura a crédito: la fecha de la primera cuota del
  // plan. Sin plan, se usa la fecha de emisión como referencia.
  func dueDateFor(invoice : BillingTypes.Invoice) : Common.Timestamp {
    switch (invoice.installments) {
      case (?plan) { plan.firstDueDate };
      case null { invoice.issuedAt };
    };
  };

  func statusFor(balance : Common.Money, dueDate : Common.Timestamp, now : Common.Timestamp) : Types.ReceivableStatus {
    if (balance == 0) { #paid } else if (dueDate < now) { #overdue } else { #pending };
  };

  func toReceivable(state : State, invoice : BillingTypes.Invoice, now : Common.Timestamp) : Types.Receivable {
    let paidAmount = paidFor(state, invoice.id);
    let balance = if (paidAmount >= invoice.total) { 0 } else { invoice.total - paidAmount };
    let dueDate = dueDateFor(invoice);
    {
      invoiceId = invoice.id;
      invoiceNumber = invoice.number;
      customerId = invoice.customerId;
      customerName = invoice.customerName;
      total = invoice.total;
      paidAmount;
      balance;
      dueDate;
      status = statusFor(balance, dueDate, now);
      issuedAt = invoice.issuedAt;
    };
  };

  // Solo las facturas a crédito son cuentas por cobrar.
  func isCredit(invoice : BillingTypes.Invoice) : Bool {
    switch (invoice.paymentCondition) {
      case (#credit) { true };
      case (#cash) { false };
    };
  };

  // Lista las cuentas por cobrar derivadas de las facturas a crédito,
  // aplicando el filtro por estado y la búsqueda por cliente o número de
  // factura.
  public func listReceivables(state : State, filter : Types.ReceivableFilter) : [Types.Receivable] {
    let now = Time.now();
    let out = List.empty<Types.Receivable>();
    for (invoice in state.invoices.values()) {
      if (not isCredit(invoice)) { continue };
      let receivable = toReceivable(state, invoice, now);
      let statusOk = switch (filter.status) {
        case null { true };
        case (?wanted) { receivable.status == wanted };
      };
      let searchOk = switch (filter.search) {
        case null { true };
        case (?term) {
          let trimmed = term.trim(#predicate (func (c : Char) : Bool = c == ' '));
          if (trimmed == "") { true } else {
            matches(receivable.customerName, trimmed) or matches(receivable.invoiceNumber, trimmed);
          };
        };
      };
      if (statusOk and searchOk) { out.add(receivable) };
    };
    out.toArray().sort(func (a, b) = Nat.compare(b.invoiceId, a.invoiceId));
  };

  // Resumen superior: total por cobrar, total vencido y número de facturas
  // abiertas.
  public func getReceivableSummary(state : State) : Types.ReceivableSummary {
    let now = Time.now();
    var totalOutstanding = 0;
    var totalOverdue = 0;
    var openCount = 0;
    for (invoice in state.invoices.values()) {
      if (not isCredit(invoice)) { continue };
      let receivable = toReceivable(state, invoice, now);
      if (receivable.balance > 0) {
        totalOutstanding += receivable.balance;
        openCount += 1;
        if (receivable.status == #overdue) { totalOverdue += receivable.balance };
      };
    };
    { totalOutstanding; totalOverdue; openCount };
  };

  // Marca como pagadas las cuotas cubiertas por el abono, en orden de
  // vencimiento, para que el plan de cuotas de la factura quede consistente.
  func applyToInstallments(plan : BillingTypes.InstallmentPlan, amount : Common.Money, at : Common.Timestamp) : BillingTypes.InstallmentPlan {
    var remaining = amount;
    let installments = plan.installments.map(
      func (installment) {
        if (installment.paid or remaining == 0) {
          installment;
        } else if (remaining >= installment.amount) {
          remaining -= installment.amount;
          { installment with paid = true; paidAt = ?at };
        } else {
          installment;
        };
      }
    );
    { plan with installments };
  };

  // Registra un abono sobre una cuenta por cobrar y recalcula el saldo
  // pendiente y el estado de la factura.
  public func registerReceivablePayment(state : State, input : Types.ReceivablePaymentInput, performedBy : Principal) : Types.ReceivablePayment {
    let invoice = state.invoices.get(input.invoiceId) ?? Runtime.trap("Factura no encontrada");
    if (not isCredit(invoice)) {
      Runtime.trap("La factura no es una cuenta por cobrar a crédito");
    };
    if (invoice.paymentStatus == #paid) {
      Runtime.trap("La factura ya fue cobrada");
    };
    if (input.amount == 0) {
      Runtime.trap("El monto del abono debe ser mayor que cero");
    };
    let paidAmount = paidFor(state, invoice.id);
    let balance = if (paidAmount >= invoice.total) { 0 } else { invoice.total - paidAmount };
    if (input.amount > balance) {
      Runtime.trap("El abono supera el saldo pendiente");
    };

    let id = state.counters.nextReceivablePaymentId;
    state.counters.nextReceivablePaymentId := id + 1;
    let at = Time.now();
    let payment : Types.ReceivablePayment = {
      id;
      invoiceId = input.invoiceId;
      amount = input.amount;
      method = input.method;
      note = input.note;
      performedBy;
      at;
    };
    state.receivablePayments.add(id, payment);

    let newPaid = paidAmount + input.amount;
    let newBalance = if (newPaid >= invoice.total) { 0 } else { invoice.total - newPaid };
    let installments = switch (invoice.installments) {
      case null { null };
      case (?plan) { ?applyToInstallments(plan, input.amount, at) };
    };
    let updated : BillingTypes.Invoice = {
      invoice with
      paymentStatus = if (newBalance == 0) { #paid } else { #pending };
      installments;
    };
    state.invoices.add(invoice.id, updated);

    payment;
  };
};
