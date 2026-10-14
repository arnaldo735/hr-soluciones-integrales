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
import PosTypes "../types/pos";
import ReceivableTypes "../types/receivables";
import CashTypes "../types/cash";
import CashLib "../lib/cash";
import Search "../lib/search";

module {
  public type Counters = {
    var nextInvoiceId : Nat;
    var nextInvoiceNumber : Nat;
    var nextCashMovementId : Nat;
    var nextShiftId : Nat;
    var nextCashRegisterId : Nat;
  };

  public type State = {
    invoices : Map.Map<Common.Id, Types.Invoice>;
    businessSettings : { var settings : Types.BusinessSettings };
    company : { var profile : CompanyTypes.CompanyProfile };
    // Estado de Caja y Bancos: el cobro de una factura registra un ingreso con
    // origen `#invoice` en el turno abierto de la cuenta correspondiente.
    cashRegisters : Map.Map<Common.Id, CashTypes.CashRegister>;
    shifts : Map.Map<Common.Id, CashTypes.Shift>;
    cashMovements : Map.Map<Common.Id, CashTypes.CashMovement>;
    counters : Counters;
  };

  // --- helpers -------------------------------------------------------------

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

  func invoiceNumberFor(n : Nat) : Text {
    "F-" # padNumber(n);
  };

  // El régimen fiscal de la empresa decide si la factura lleva IVA; la tarifa
  // configurada vive en el perfil de empresa.
  func effectiveTaxRate(state : State) : Common.TaxRate {
    CompanyTypes.effectiveTaxRate(state.company.profile, state.company.profile.taxRate);
  };

  // Construye el plan de cuotas sobre el saldo a cobrar. Las cuotas son de
  // igual valor y suman exactamente el saldo: el residuo de la división entera
  // se reparte en las primeras cuotas. Los vencimientos van mes a mes desde
  // `firstDueDate`.
  func buildInstallmentPlan(plan : ?Types.CreditPlanInput, amount : Common.Money) : Types.InstallmentPlan {
    let input = plan ?? Runtime.trap("El plan de cuotas es obligatorio para una factura a crédito");
    if (input.installmentCount == 0) {
      Runtime.trap("El número de cuotas debe ser mayor que cero");
    };
    let count = input.installmentCount;
    let base = amount / count;
    let remainder = amount % count;
    let installments = List.empty<Types.Installment>();
    var index = 0;
    while (index < count) {
      let installmentAmount = if (index < remainder) { base + 1 } else { base };
      installments.add({
        number = index + 1;
        amount = installmentAmount;
        dueDate = input.firstDueDate + (index * 30 * 24 * 60 * 60 * 1_000_000_000);
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

  func isCredit(condition : Types.PaymentCondition) : Bool {
    switch (condition) {
      case (#credit) { true };
      case (#cash) { false };
    };
  };

  // Comprueba si una orden ya tiene una factura asociada.
  func orderHasInvoice(state : State, orderId : Common.Id) : Bool {
    var found = false;
    for (invoice in state.invoices.values()) {
      switch (invoice.origin) {
        case (#workshopOrder) {
          if (invoice.orderId == ?orderId) { found := true };
        };
        case (_) {};
      };
    };
    found;
  };

  // Comprueba si una venta POS ya tiene una factura asociada.
  func posSaleHasInvoice(state : State, posSaleId : Common.Id) : Bool {
    var found = false;
    for (invoice in state.invoices.values()) {
      switch (invoice.origin) {
        case (#pos) {
          if (invoice.posSaleId == ?posSaleId) { found := true };
        };
        case (_) {};
      };
    };
    found;
  };

  // Suma de los abonos registrados sobre una factura. Se usa para impedir
  // eliminar una factura con abonos.
  func hasReceivablePayments(receivablePayments : Map.Map<Common.Id, ReceivableTypes.ReceivablePayment>, invoiceId : Common.Id) : Bool {
    var found = false;
    for (payment in receivablePayments.values()) {
      if (payment.invoiceId == invoiceId) { found := true };
    };
    found;
  };

  // Registra el ingreso del cobro de una factura en Caja y Bancos. La cuenta
  // se deriva del medio de pago con la misma regla que anticipos y abonos
  // (`CashLib.accountFor`), y el movimiento se liga al turno abierto de esa
  // cuenta, abriendo uno automáticamente si no existe
  // (`CashLib.resolveOrOpenShiftForAccount`). `reference` es el número de
  // factura y `source` distingue el cobro de factura (`#invoice`) del abono de
  // cartera (`#receivable`).
  func recordInvoiceMovement(
    state : State,
    invoice : Types.Invoice,
    method : Types.PaymentMethod,
    amount : Common.Money,
    source : CashTypes.CashMovementSource,
    performedBy : Principal,
  ) {
    let account = CashLib.accountFor(method, #cash);
    let shift = CashLib.resolveOrOpenShiftForAccount(state, account, performedBy, "Sistema (automático)");
    let id = state.counters.nextCashMovementId;
    state.counters.nextCashMovementId := id + 1;
    let movement : CashTypes.CashMovement = {
      id;
      shiftId = shift.id;
      timestamp = Time.now();
      kind = #income;
      paymentMethod = method;
      amount;
      account;
      description = "Cobro factura " # invoice.number;
      reference = ?invoice.number;
      source;
    };
    state.cashMovements.add(id, movement);
  };

  // Construye una factura a partir de líneas ya resueltas. `advanceApplied` es
  // el anticipo descontado (null cuando no aplica) y el plan de cuotas se
  // calcula sobre el saldo a cobrar `total - advanceApplied`.
  //
  // Una factura de contado nace `#paid`: su cobro se registra aquí mismo en
  // Caja y Bancos por el saldo a cobrar (`total − anticipo aplicado`), con
  // origen `#invoice` y referencia al número de factura. El anticipo ya se
  // registró al crear la OT (movimiento `#advance`), por lo que no se duplica.
  // Una factura a crédito nace `#pending` y su cobro se registra al marcarla
  // pagada o al cobrar cada cuota.
  public func persistInvoice(
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
    advanceApplied : ?Common.Money,
    paymentMethod : Types.PaymentMethod,
    paymentCondition : Types.PaymentCondition,
    creditPlan : ?Types.CreditPlanInput,
    performedBy : Principal,
  ) : Types.Invoice {
    var subtotal = 0;
    for (line in lines.values()) {
      subtotal += line.amount;
    };
    let taxableBase = if (discount >= subtotal) { 0 } else { subtotal - discount };
    let taxRate = effectiveTaxRate(state);
    let tax = (taxableBase * taxRate) / 100;
    let total = taxableBase + tax;
    let advance = advanceApplied ?? 0;
    if (advance > total) {
      Runtime.trap("El anticipo no puede superar el total de la factura");
    };
    let balance = total - advance;
    let credit = isCredit(paymentCondition);
    let id = state.counters.nextInvoiceId;
    state.counters.nextInvoiceId := id + 1;
    let numberSeq = state.counters.nextInvoiceNumber;
    state.counters.nextInvoiceNumber := numberSeq + 1;
    let invoice : Types.Invoice = {
      id;
      number = invoiceNumberFor(numberSeq);
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
      advanceApplied;
      paymentMethod;
      paymentCondition;
      paymentStatus = if (credit) { #pending } else { #paid };
      installments = if (credit) { ?buildInstallmentPlan(creditPlan, balance) } else { null };
      issuedAt = Time.now();
    };
    state.invoices.add(id, invoice);
    // Una factura de contado nace pagada: su cobro se registra de inmediato en
    // Caja y Bancos por el saldo a cobrar. El anticipo ya está registrado como
    // movimiento `#advance` de la OT, así que solo se registra el saldo
    // restante y no se duplica.
    if (not credit and balance > 0) {
      recordInvoiceMovement(state, invoice, paymentMethod, balance, #invoice, performedBy);
    };
    invoice;
  };

  // --- public API ----------------------------------------------------------

  public func getBusinessSettings(state : State) : Types.BusinessSettings {
    state.businessSettings.settings;
  };

  public func updateBusinessSettings(state : State, settings : Types.BusinessSettings) : Types.BusinessSettings {
    state.businessSettings.settings := settings;
    settings;
  };

  // Genera una factura desde una orden de taller. Solo las órdenes entregadas
  // son facturables. El anticipo registrado en la orden se descuenta del total
  // y queda en `advanceApplied`; el saldo a cobrar es `total - advanceApplied`.
  // En una factura a crédito, el plan de cuotas se calcula sobre el saldo a
  // cobrar, no sobre el total.
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
    let order = orders.get(orderId) ?? Runtime.trap("Orden no encontrada");
    if (order.status != #delivered) {
      Runtime.trap("Solo se puede facturar una orden entregada");
    };
    if (orderHasInvoice(state, orderId)) {
      Runtime.trap("La orden ya está facturada");
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

    let customerName = switch (customers.get(order.customerId)) {
      case (?customer) { customer.name };
      case null { "" };
    };
    let customerTaxId = switch (customers.get(order.customerId)) {
      case (?customer) { customer.document };
      case null { null };
    };
    let customerAddress = switch (customers.get(order.customerId)) {
      case (?customer) { customer.address };
      case null { null };
    };
    let advanceApplied = switch (order.advance) {
      case (?advance) { ?advance.amount };
      case null { null };
    };

    persistInvoice(
      state,
      #workshopOrder,
      ?orderId,
      null,
      ?order.customerId,
      customerName,
      customerTaxId,
      customerAddress,
      lines.toArray(),
      0,
      advanceApplied,
      paymentMethod,
      paymentCondition,
      creditPlan,
      performedBy,
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
    ignore quoteId;
    let customerName = switch (customers.get(customerId)) {
      case (?customer) { customer.name };
      case null { "" };
    };
    let customerTaxId = switch (customers.get(customerId)) {
      case (?customer) { customer.document };
      case null { null };
    };
    let customerAddress = switch (customers.get(customerId)) {
      case (?customer) { customer.address };
      case null { null };
    };
    persistInvoice(
      state,
      #quote,
      null,
      null,
      ?customerId,
      customerName,
      customerTaxId,
      customerAddress,
      lines,
      discount,
      null,
      paymentMethod,
      paymentCondition,
      creditPlan,
      performedBy,
    );
  };

  // Una venta POS solo puede facturarse una vez: si ya apunta a una factura
  // (`invoiceId` distinto de cero), se rechaza hasta que esa factura se
  // elimine y libere la venta.
  public func createInvoiceFromPosSale(
    state : State,
    posSales : Map.Map<Common.Id, PosTypes.PosSale>,
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
    let sale = posSales.get(posSaleId) ?? Runtime.trap("Venta no encontrada");
    if (sale.invoiceId != 0) {
      Runtime.trap("La venta ya está facturada");
    };
    if (posSaleHasInvoice(state, posSaleId)) {
      Runtime.trap("La venta ya está facturada");
    };
    let resolvedName = switch (customerName) {
      case (?name) { name };
      case null {
        switch (customerId) {
          case (?id) {
            switch (customers.get(id)) {
              case (?customer) { customer.name };
              case null { "Cliente de mostrador" };
            };
          };
          case null { "Cliente de mostrador" };
        };
      };
    };
    let customerTaxId = switch (customerId) {
      case (?id) {
        switch (customers.get(id)) {
          case (?customer) { customer.document };
          case null { null };
        };
      };
      case null { null };
    };
    let customerAddress = switch (customerId) {
      case (?id) {
        switch (customers.get(id)) {
          case (?customer) { customer.address };
          case null { null };
        };
      };
      case null { null };
    };
    persistInvoice(
      state,
      #pos,
      null,
      ?posSaleId,
      customerId,
      resolvedName,
      customerTaxId,
      customerAddress,
      lines,
      discount,
      null,
      paymentMethod,
      paymentCondition,
      creditPlan,
      performedBy,
    );
  };

  public func listInvoices(state : State, filter : Types.InvoiceFilter, offset : Nat, limit : Nat) : Types.InvoicePage {
    let matched = List.empty<Types.Invoice>();
    for (invoice in state.invoices.values()) {
      let fromOk = switch (filter.from) {
        case null { true };
        case (?from) { invoice.issuedAt >= from };
      };
      let toOk = switch (filter.to) {
        case null { true };
        case (?to) { invoice.issuedAt <= to };
      };
      let searchOk = switch (filter.search) {
        case null { true };
        case (?term) {
          let needle = Search.normalize(term);
          if (needle == "") { true } else {
            Search.contains(invoice.number, needle) or Search.contains(invoice.customerName, needle);
          };
        };
      };
      if (fromOk and toOk and searchOk) { matched.add(invoice) };
    };
    let sorted = matched.toArray().sort(func (a, b) = Nat.compare(b.id, a.id));
    let total = sorted.size();
    let start = if (offset > total) { total } else { offset };
    let end = Nat.min(start + limit, total);
    { items = sorted.sliceToArray(start, end); total; offset; limit };
  };

  public func getInvoice(state : State, id : Common.Id) : ?Types.Invoice {
    state.invoices.get(id);
  };

  // Elimina una factura solo cuando está pendiente de pago y no tiene ningún
  // abono registrado. Al eliminarla se libera la OT o venta POS de origen para
  // poder facturarse de nuevo. Falla si la factura ya tiene pagos o abonos.
  public func deleteInvoice(
    state : State,
    posSales : Map.Map<Common.Id, PosTypes.PosSale>,
    receivablePayments : Map.Map<Common.Id, ReceivableTypes.ReceivablePayment>,
    id : Common.Id,
    performedBy : Principal,
  ) : Bool {
    ignore performedBy;
    let invoice = state.invoices.get(id) ?? Runtime.trap("Factura no encontrada");
    if (invoice.paymentStatus == #paid) {
      Runtime.trap("La factura ya está pagada y no se puede eliminar");
    };
    if (hasReceivablePayments(receivablePayments, id)) {
      Runtime.trap("La factura tiene abonos registrados y no se puede eliminar");
    };
    // Libera la venta POS de origen para poder facturarla de nuevo.
    switch (invoice.origin) {
      case (#pos) {
        switch (invoice.posSaleId) {
          case (?posSaleId) {
            switch (posSales.get(posSaleId)) {
              case (?sale) { posSales.add(posSaleId, { sale with invoiceId = 0 }) };
              case null {};
            };
          };
          case null {};
        };
      };
      case (_) {};
    };
    state.invoices.remove(id);
    true;
  };

  // Marca una factura como pagada. Rechaza un segundo cobro de una factura ya
  // pagada y, en una factura a crédito, da por pagadas todas sus cuotas.
  public func markInvoicePaid(
    state : State,
    id : Common.Id,
    paymentMethod : Types.PaymentMethod,
    performedBy : Principal,
  ) : Types.Invoice {
    let invoice = state.invoices.get(id) ?? Runtime.trap("Factura no encontrada");
    if (invoice.paymentStatus == #paid) {
      Runtime.trap("La factura ya fue cobrada");
    };
    let now = Time.now();
    let installments = switch (invoice.installments) {
      case null { null };
      case (?plan) {
        ?{
          plan with
          installments = plan.installments.map(
            func (installment) {
              if (installment.paid) { installment } else { { installment with paid = true; paidAt = ?now } };
            }
          );
        };
      };
    };
    let updated : Types.Invoice = {
      invoice with
      paymentMethod;
      paymentStatus = #paid;
      installments;
    };
    state.invoices.add(id, updated);
    // El cobro de la factura registra su ingreso en Caja y Bancos. El monto es
    // el saldo cobrado (`total − anticipo aplicado`): el anticipo ya se
    // registró al crear la OT, así que no se duplica. Una factura `#pos` de
    // contado ya nació pagada y este método la rechaza arriba, por lo que el
    // movimiento `#pos` de la venta no se repite aquí.
    let advance = switch (invoice.advanceApplied) {
      case (?value) { value };
      case null { 0 };
    };
    let collected = if (advance >= invoice.total) { 0 } else { invoice.total - advance };
    if (collected > 0) {
      recordInvoiceMovement(state, updated, paymentMethod, collected, #invoice, performedBy);
    };
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
    let invoice = state.invoices.get(id) ?? Runtime.trap("Factura no encontrada");
    if (invoice.paymentStatus == #paid) {
      Runtime.trap("La factura ya fue cobrada");
    };
    let plan = invoice.installments ?? Runtime.trap("La factura no tiene plan de cuotas");
    let now = Time.now();
    var found = false;
    let installments = plan.installments.map(
      func (installment) {
        if (installment.number == installmentNumber) {
          found := true;
          if (installment.paid) {
            Runtime.trap("La cuota ya fue pagada");
          };
          { installment with paid = true; paidAt = ?now };
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
    // Cada cuota cobrada registra su ingreso en Caja y Bancos con el medio de
    // pago de la factura. El monto es el valor de la cuota pagada.
    let paidInstallment = plan.installments.find(func (installment) = installment.number == installmentNumber);
    let amount = switch (paidInstallment) {
      case (?installment) { installment.amount };
      case null { 0 };
    };
    if (amount > 0) {
      recordInvoiceMovement(state, updated, invoice.paymentMethod, amount, #invoice, performedBy);
    };
    updated;
  };
};
