import List "mo:core/List";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";

import Common "../types/common";
import Types "../types/billing";
import CustomerTypes "../types/customers";
import CompanyTypes "../types/company";
import WorkshopTypes "../types/workshop";

module {
  public type Counters = {
    var nextInvoiceId : Nat;
    var nextInvoiceNumber : Nat;
  };

  public type State = {
    invoices : Map.Map<Common.Id, Types.Invoice>;
    businessSettings : { var settings : Types.BusinessSettings };
    company : { var profile : CompanyTypes.CompanyProfile };
    counters : Counters;
  };

  public func getBusinessSettings(state : State) : Types.BusinessSettings {
    state.businessSettings.settings;
  };

  public func updateBusinessSettings(state : State, settings : Types.BusinessSettings) : Types.BusinessSettings {
    state.businessSettings.settings := settings;
    settings;
  };

  func padNumber(n : Nat) : Text {
    let raw = n.toText();
    var zeros = "";
    var i = raw.size();
    while (i < 6) {
      zeros := zeros # "0";
      i += 1;
    };
    zeros # raw;
  };

  func nextInvoiceNumber(state : State) : Text {
    let n = state.counters.nextInvoiceNumber;
    state.counters.nextInvoiceNumber := n + 1;
    "F-" # padNumber(n);
  };

  func customerTaxIdFor(customers : Map.Map<Common.Id, CustomerTypes.Customer>, customerId : ?Common.Id) : ?Text {
    switch (customerId) {
      case null { null };
      case (?id) {
        switch (customers.get(id)) {
          case (?customer) { customer.document };
          case null { null };
        };
      };
    };
  };

  func customerNameFor(customers : Map.Map<Common.Id, CustomerTypes.Customer>, customerId : ?Common.Id, fallback : Text) : Text {
    switch (customerId) {
      case null { fallback };
      case (?id) {
        switch (customers.get(id)) {
          case (?customer) { customer.name };
          case null { fallback };
        };
      };
    };
  };

  func customerAddressFor(customers : Map.Map<Common.Id, CustomerTypes.Customer>, customerId : ?Common.Id) : ?Text {
    switch (customerId) {
      case null { null };
      case (?id) {
        switch (customers.get(id)) {
          case (?customer) { customer.address };
          case null { null };
        };
      };
    };
  };

  func persistInvoice(
    state : State,
    origin : Types.InvoiceOrigin,
    orderId : ?Common.Id,
    posSaleId : ?Common.Id,
    customerId : ?Common.Id,
    customerName : Text,
    customerTaxId : ?Text,
    customerAddress : ?Text,
    lines : [Types.InvoiceLine],
    discount : Common.Money,
    paymentMethod : Types.PaymentMethod,
    paymentCondition : Types.PaymentCondition,
    creditPlan : ?Types.CreditPlanInput,
  ) : Types.Invoice {
    var subtotal = 0;
    for (line in lines.values()) {
      subtotal += line.amount;
    };
    let taxableBase = if (discount >= subtotal) { 0 } else { subtotal - discount };    // El régimen fiscal de la empresa decide si la factura lleva IVA; la
    // tarifa configurada vive en el perfil de empresa.
    let taxRate = CompanyTypes.effectiveTaxRate(state.company.profile, state.company.profile.taxRate);
    let tax = (taxableBase * taxRate) / 100;
    let total = taxableBase + tax;
    let installments = switch (paymentCondition) {
      case (#cash) { null };
      case (#credit) { ?buildInstallmentPlan(creditPlan, total) };
    };
    let id = state.counters.nextInvoiceId;
    state.counters.nextInvoiceId := id + 1;
    let invoice : Types.Invoice = {
      id;
      number = nextInvoiceNumber(state);
      origin;
      orderId;
      posSaleId;
      customerId;
      customerName;
      customerTaxId;
      customerAddress;
      lines;
      subtotal;
      discount;
      taxRate;
      tax;
      total;
      paymentMethod;
      paymentCondition;
      paymentStatus = #pending;
      installments;
      issuedAt = Time.now();
    };
    state.invoices.add(id, invoice);
    invoice;
  };

  // Construye el plan de cuotas de una factura a crédito. Las cuotas son de
  // igual valor y suman exactamente el total: el residuo de la división entera
  // se reparte en las primeras cuotas. Los vencimientos van mes a mes desde
  // `firstDueDate`.
  func buildInstallmentPlan(plan : ?Types.CreditPlanInput, total : Common.Money) : Types.InstallmentPlan {
    let input = plan ?? Runtime.trap("El plan de cuotas es obligatorio para una factura a crédito");
    if (input.installmentCount == 0) {
      Runtime.trap("El número de cuotas debe ser mayor que cero");
    };
    let count = input.installmentCount;
    let base = total / count;
    let remainder = total % count;
    let installments = List.empty<Types.Installment>();
    var index = 0;
    while (index < count) {
      let amount = if (index < remainder) { base + 1 } else { base };
      installments.add({
        number = index + 1;
        amount;
        dueDate = addMonths(input.firstDueDate, index);
        paid = false;
        paidAt = null;
      });
      index += 1;
    };
    {
      installmentCount = count;
      firstDueDate = input.firstDueDate;
      installments = installments.toArray();
    };
  };

  // Suma `months` meses a un timestamp en nanosegundos. Se usa un mes de 30
  // días para que el vencimiento sea determinista y no dependa del calendario.
  func addMonths(at : Common.Timestamp, months : Nat) : Common.Timestamp {
    at + (months * 30 * 24 * 60 * 60 * 1_000_000_000);
  };

  // Solo las órdenes entregadas son facturables.
  public func createInvoiceFromOrder(
    state : State,
    orders : Map.Map<Common.Id, WorkshopTypes.WorkshopOrder>,
    customers : Map.Map<Common.Id, CustomerTypes.Customer>,
    orderId : Common.Id,
    paymentMethod : Types.PaymentMethod,
    paymentCondition : Types.PaymentCondition,
    creditPlan : ?Types.CreditPlanInput,
    performedBy : Principal,
  ) : Types.Invoice {
    ignore performedBy;
    let order = orders.get(orderId) ?? Runtime.trap("Orden no encontrada");
    switch (order.status) {
      case (#delivered) {};
      case (#cancelled) { Runtime.trap("La orden está cancelada y no se puede facturar") };
      case (_) { Runtime.trap("Solo se puede facturar una orden entregada") };
    };
    let lines = List.empty<Types.InvoiceLine>();
    for (part in order.parts.values()) {
      lines.add({
        description = part.description;
        quantity = part.quantity;
        unitPrice = part.unitPrice;
        amount = part.quantity * part.unitPrice;
        kind = #part;
        unitCost = part.unitCost;
      });
    };
    for (item in order.labor.values()) {
      lines.add({
        description = item.description;
        quantity = 1;
        unitPrice = item.price;
        amount = item.price;
        kind = #service;
        unitCost = 0;
      });
    };
    let customerId = ?order.customerId;
    persistInvoice(
      state,
      #workshopOrder,
      ?orderId,
      null,
      customerId,
      customerNameFor(customers, customerId, ""),
      customerTaxIdFor(customers, customerId),
      customerAddressFor(customers, customerId),
      lines.toArray(),
      0,
      paymentMethod,
      paymentCondition,
      creditPlan,
    );
  };

  public func createInvoiceFromQuote(
    state : State,
    customers : Map.Map<Common.Id, CustomerTypes.Customer>,
    quoteId : Common.Id,
    customerId : Common.Id,
    lines : [Types.InvoiceLine],
    discount : Common.Money,
    paymentMethod : Types.PaymentMethod,
    paymentCondition : Types.PaymentCondition,
    creditPlan : ?Types.CreditPlanInput,
    performedBy : Principal,
  ) : Types.Invoice {
    ignore (performedBy, quoteId);
    let resolvedCustomerId = ?customerId;
    persistInvoice(
      state,
      #quote,
      null,
      null,
      resolvedCustomerId,
      customerNameFor(customers, resolvedCustomerId, ""),
      customerTaxIdFor(customers, resolvedCustomerId),
      customerAddressFor(customers, resolvedCustomerId),
      lines,
      discount,
      paymentMethod,
      paymentCondition,
      creditPlan,
    );
  };

  public func createInvoiceFromPosSale(
    state : State,
    customers : Map.Map<Common.Id, CustomerTypes.Customer>,
    posSaleId : Common.Id,
    customerId : ?Common.Id,
    customerName : ?Text,
    lines : [Types.InvoiceLine],
    discount : Common.Money,
    paymentMethod : Types.PaymentMethod,
    paymentCondition : Types.PaymentCondition,
    creditPlan : ?Types.CreditPlanInput,
    performedBy : Principal,
  ) : Types.Invoice {
    ignore performedBy;
    let fallback = customerName ?? "Cliente de mostrador";
    persistInvoice(
      state,
      #pos,
      null,
      ?posSaleId,
      customerId,
      customerNameFor(customers, customerId, fallback),
      customerTaxIdFor(customers, customerId),
      customerAddressFor(customers, customerId),
      lines,
      discount,
      paymentMethod,
      paymentCondition,
      creditPlan,
    );
  };

  public func listInvoices(state : State, filter : Types.InvoiceFilter, offset : Nat, limit : Nat) : Types.InvoicePage {
    let all = state.invoices.values().toArray();
    let matched = all.filter(
      func inv {
        let searchOk = switch (filter.search) {
          case null { true };
          case (?term) {
            let q = term.toLower();
            inv.number.toLower().contains(#text q) or inv.customerName.toLower().contains(#text q);
          };
        };
        let fromOk = switch (filter.from) {
          case null { true };
          case (?from) { inv.issuedAt >= from };
        };
        let toOk = switch (filter.to) {
          case null { true };
          case (?to) { inv.issuedAt <= to };
        };
        searchOk and fromOk and toOk;
      }
    );
    let sorted = matched.sort(func(a, b) = Nat.compare(b.id, a.id));
    let total = sorted.size();
    let items = sorted.sliceToArray(offset, offset + limit);
    { items; total; offset; limit };
  };

  public func getInvoice(state : State, id : Common.Id) : ?Types.Invoice {
    state.invoices.get(id);
  };

  public func markInvoicePaid(
    state : State,
    id : Common.Id,
    paymentMethod : Types.PaymentMethod,
    performedBy : Principal,
  ) : Types.Invoice {
    ignore performedBy;
    let invoice = state.invoices.get(id) ?? Runtime.trap("Invoice not found");
    let updated : Types.Invoice = {
      invoice with
      paymentMethod;
      paymentStatus = #paid;
    };
    state.invoices.add(id, updated);
    updated;
  };

  // Registra el pago de una cuota individual de una factura a crédito. La
  // factura pasa a `#paid` solo cuando todas las cuotas están pagadas.
  public func registerInstallmentPayment(
    state : State,
    id : Common.Id,
    installmentNumber : Nat,
    performedBy : Principal,
  ) : Types.Invoice {
    ignore performedBy;
    let invoice = state.invoices.get(id) ?? Runtime.trap("Factura no encontrada");
    let plan = invoice.installments ?? Runtime.trap("La factura no tiene plan de cuotas");
    var found = false;
    let installments = plan.installments.map(
      func (installment) {
        if (installment.number == installmentNumber) {
          found := true;
          if (installment.paid) {
            Runtime.trap("La cuota ya fue pagada");
          };
          { installment with paid = true; paidAt = ?Time.now() };
        } else {
          installment;
        };
      }
    );
    if (not found) {
      Runtime.trap("Cuota no encontrada");
    };
    let allPaid = installments.all(func (installment) = installment.paid);
    let updated : Types.Invoice = {
      invoice with
      installments = ?{ plan with installments };
      paymentStatus = if (allPaid) { #paid } else { #pending };
    };
    state.invoices.add(id, updated);
    updated;
  };
};
