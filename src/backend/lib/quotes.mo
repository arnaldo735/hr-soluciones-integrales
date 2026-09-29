import List "mo:core/List";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Order "mo:core/Order";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Text "mo:core/Text";
import Time "mo:core/Time";

import Common "../types/common";
import Types "../types/quotes";
import CustomerTypes "../types/customers";
import WorkshopTypes "../types/workshop";
import BillingTypes "../types/billing";
import CompanyTypes "../types/company";
import ServiceTypes "../types/services";
import InventoryTypes "../types/inventory";
import Search "../lib/search";

module {
  public type Counters = {
    var nextQuoteId : Nat;
    var nextQuoteNumber : Nat;
    var nextQuotePartLineId : Nat;
    var nextQuoteServiceLineId : Nat;
    var nextOrderId : Nat;
    var nextOrderPartId : Nat;
    var nextLaborId : Nat;
    var nextInvoiceId : Nat;
    var nextInvoiceNumber : Nat;
  };

  public type State = {
    quotes : Map.Map<Common.Id, Types.Quote>;
    customers : Map.Map<Common.Id, CustomerTypes.Customer>;
    motorcycles : Map.Map<Common.Id, CustomerTypes.Motorcycle>;
    parts : Map.Map<Common.Id, InventoryTypes.Part>;
    services : Map.Map<Common.Id, ServiceTypes.Service>;
    orders : Map.Map<Common.Id, WorkshopTypes.WorkshopOrder>;
    invoices : Map.Map<Common.Id, BillingTypes.Invoice>;
    businessSettings : { var settings : BillingTypes.BusinessSettings };
    company : { var profile : CompanyTypes.CompanyProfile };
    counters : Counters;
  };

  // El régimen fiscal de la empresa decide si se aplica IVA; la tarifa
  // configurada vive en el perfil de empresa (`CompanyProfile.taxRate`) y solo
  // se usa cuando la empresa es responsable de IVA.
  func effectiveTaxRate(state : State) : Common.TaxRate {
    CompanyTypes.effectiveTaxRate(state.company.profile, state.company.profile.taxRate);
  };

  // --- helpers -------------------------------------------------------------

  func statusText(status : Types.QuoteStatus) : Text {
    switch (status) {
      case (#draft) { "draft" };
      case (#sent) { "sent" };
      case (#accepted) { "accepted" };
      case (#rejected) { "rejected" };
      case (#expired) { "expired" };
    };
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

  func quoteNumberFor(n : Nat) : Text {
    "COT-" # padNumber(n);
  };

  func orderNumberFor(n : Nat) : Text {
    "OT-" # padNumber(n);
  };

  func invoiceNumberFor(n : Nat) : Text {
    "F-" # padNumber(n);
  };

  func partName(state : State, partId : Common.Id) : Text {
    switch (state.parts.get(partId)) {
      case (?part) { part.name };
      case null { "Repuesto #" # partId.toText() };
    };
  };

  func findQuote(state : State, id : Common.Id) : Types.Quote {
    state.quotes.get(id) ?? Runtime.trap("Cotización no encontrada");
  };

  func buildPartLines(state : State, inputs : [Types.QuotePartLineInput]) : [Types.QuotePartLine] {
    let out = List.empty<Types.QuotePartLine>();
    for (input in inputs.values()) {
      let id = state.counters.nextQuotePartLineId;
      state.counters.nextQuotePartLineId := id + 1;
      out.add({
        id;
        partId = input.partId;
        description = partName(state, input.partId);
        quantity = input.quantity;
        unitPrice = input.unitPrice;
      });
    };
    out.toArray();
  };

  func buildServiceLines(state : State, inputs : [Types.QuoteServiceLineInput]) : [Types.QuoteServiceLine] {
    let out = List.empty<Types.QuoteServiceLine>();
    for (input in inputs.values()) {
      let id = state.counters.nextQuoteServiceLineId;
      state.counters.nextQuoteServiceLineId := id + 1;
      out.add({
        id;
        serviceId = input.serviceId;
        description = input.description;
        quantity = input.quantity;
        unitPrice = input.unitPrice;
      });
    };
    out.toArray();
  };

  func matchesSearch(state : State, quote : Types.Quote, term : Text) : Bool {
    let needle = Search.normalize(term);
    if (Search.contains(quote.quoteNumber, needle)) { return true };
    switch (state.customers.get(quote.customerId)) {
      case (?customer) {
        if (Search.contains(customer.name, needle)) { return true };
      };
      case null {};
    };
    false;
  };

  func compareQuotes(state : State, a : Types.Quote, b : Types.Quote, sort : Types.QuoteSort) : Order.Order {
    switch (sort) {
      case (#number) { Text.compare(a.quoteNumber, b.quoteNumber) };
      case (#customer) {
        let nameA = switch (state.customers.get(a.customerId)) {
          case (?customer) { Search.sortKey(customer.name) };
          case null { "" };
        };
        let nameB = switch (state.customers.get(b.customerId)) {
          case (?customer) { Search.sortKey(customer.name) };
          case null { "" };
        };
        Text.compare(nameA, nameB);
      };
      case (#createdAt) { Int.compare(a.createdAt, b.createdAt) };
      case (#total) { Nat.compare(computeTotals(state, a).total, computeTotals(state, b).total) };
    };
  };

  // --- public API ----------------------------------------------------------

  public func listQuotes(state : State, filter : Types.QuoteFilter, sort : Types.QuoteSort, offset : Nat, limit : Nat) : Types.QuotePage {
    let matched = List.empty<Types.Quote>();
    for (quote in state.quotes.values()) {
      var keep = true;
      switch (filter.status) {
        case (?status) { if (quote.status != status) { keep := false } };
        case null {};
      };
      switch (filter.search) {
        case (?term) {
          if (term.size() > 0 and not matchesSearch(state, quote, term)) { keep := false };
        };
        case null {};
      };
      if (keep) { matched.add(quote) };
    };
    let sorted = matched.toArray().sort(func (a, b) = compareQuotes(state, a, b, sort));
    let total = sorted.size();
    let start = if (offset > total) { total } else { offset };
    let end = Nat.min(start + limit, total);
    {
      items = sorted.sliceToArray(start, end).map(func quote = { quote; totals = computeTotals(state, quote) });
      total;
      offset;
      limit;
    };
  };

  public func getQuote(state : State, id : Common.Id) : ?Types.QuoteView {
    switch (state.quotes.get(id)) {
      case (?quote) { ?{ quote; totals = computeTotals(state, quote) } };
      case null { null };
    };
  };

  public func createQuote(state : State, input : Types.QuoteInput, performedBy : Principal) : Types.QuoteView {
    ignore performedBy;
    ignore state.customers.get(input.customerId) ?? Runtime.trap("Cliente no encontrado");
    ignore state.motorcycles.get(input.motorcycleId) ?? Runtime.trap("Moto no encontrada");
    let id = state.counters.nextQuoteId;
    state.counters.nextQuoteId := id + 1;
    let number = state.counters.nextQuoteNumber;
    state.counters.nextQuoteNumber := number + 1;
    let now = Time.now();
    let quote : Types.Quote = {
      id;
      quoteNumber = quoteNumberFor(number);
      customerId = input.customerId;
      motorcycleId = input.motorcycleId;
      status = #draft;
      partLines = buildPartLines(state, input.partLines);
      serviceLines = buildServiceLines(state, input.serviceLines);
      discount = input.discount;
      taxRate = effectiveTaxRate(state);
      notes = input.notes;
      createdAt = now;
      updatedAt = now;
    };
    state.quotes.add(id, quote);
    { quote; totals = computeTotals(state, quote) };
  };

  public func updateQuote(state : State, id : Common.Id, input : Types.QuoteInput, performedBy : Principal) : Types.QuoteView {
    ignore performedBy;
    let existing = findQuote(state, id);
    ignore state.customers.get(input.customerId) ?? Runtime.trap("Cliente no encontrado");
    ignore state.motorcycles.get(input.motorcycleId) ?? Runtime.trap("Moto no encontrada");
    let updated : Types.Quote = {
      existing with
      customerId = input.customerId;
      motorcycleId = input.motorcycleId;
      partLines = buildPartLines(state, input.partLines);
      serviceLines = buildServiceLines(state, input.serviceLines);
      discount = input.discount;
      notes = input.notes;
      updatedAt = Time.now();
    };
    state.quotes.add(id, updated);
    { quote = updated; totals = computeTotals(state, updated) };
  };

  public func deleteQuote(state : State, id : Common.Id, performedBy : Principal) : Bool {
    ignore performedBy;
    switch (state.quotes.get(id)) {
      case null { false };
      case (?_) {
        state.quotes.remove(id);
        true;
      };
    };
  };

  public func updateQuoteStatus(state : State, id : Common.Id, status : Types.QuoteStatus, performedBy : Principal) : Types.QuoteView {
    ignore performedBy;
    let quote = findQuote(state, id);
    let from = quote.status;
    let valid = switch (from, status) {
      case (#draft, #sent) { true };
      case (#draft, #accepted) { true };
      case (#draft, #rejected) { true };
      case (#draft, #expired) { true };
      case (#sent, #accepted) { true };
      case (#sent, #rejected) { true };
      case (#sent, #expired) { true };
      case (_, _) { false };
    };
    if (not valid) {
      Runtime.trap("Transición de estado inválida: " # statusText(from) # " -> " # statusText(status));
    };
    let updated : Types.Quote = { quote with status; updatedAt = Time.now() };
    state.quotes.add(id, updated);
    { quote = updated; totals = computeTotals(state, updated) };
  };

  public func convertQuoteToOrder(state : State, id : Common.Id, performedBy : Principal) : WorkshopTypes.OrderView {
    let quote = findQuote(state, id);
    if (quote.status != #accepted) {
      Runtime.trap("Solo se puede convertir una cotización aceptada");
    };
    let orderId = state.counters.nextOrderId;
    state.counters.nextOrderId := orderId + 1;
    let now = Time.now();

    let parts = List.empty<WorkshopTypes.OrderPart>();
    for (line in quote.partLines.values()) {
      let orderPartId = state.counters.nextOrderPartId;
      state.counters.nextOrderPartId := orderPartId + 1;
      parts.add({
        id = orderPartId;
        partId = line.partId;
        lotId = null;
        description = line.description;
        quantity = line.quantity;
        unitPrice = line.unitPrice;
        unitCost = 0;
      });
    };

    let labor = List.empty<WorkshopTypes.LaborItem>();
    for (line in quote.serviceLines.values()) {
      let laborId = state.counters.nextLaborId;
      state.counters.nextLaborId := laborId + 1;
      labor.add({ id = laborId; description = line.description; price = line.quantity * line.unitPrice; technicianId = null; serviceId = line.serviceId });
    };

    let order : WorkshopTypes.WorkshopOrder = {
      id = orderId;
      orderNumber = orderNumberFor(orderId);
      customerId = quote.customerId;
      motorcycleId = quote.motorcycleId;
      intakeMileage = 0;
      problem = "Orden generada desde cotización " # quote.quoteNumber;
      status = #received;
      parts = parts.toArray();
      labor = labor.toArray();
      photos = [];
      technicianIds = [];
      statusHistory = [{ from = null; to = #received; performedBy; at = now }];
      cancelReason = null;
      cancelledAt = null;
      createdAt = now;
      updatedAt = now;
    };
    state.orders.add(orderId, order);

    var partsSubtotal = 0;
    for (part in order.parts.values()) {
      partsSubtotal += part.quantity * part.unitPrice;
    };
    var laborSubtotal = 0;
    for (item in order.labor.values()) {
      laborSubtotal += item.price;
    };
    let subtotal = partsSubtotal + laborSubtotal;
    let taxRate = effectiveTaxRate(state);
    let tax = (subtotal * taxRate) / 100;
    {
      order;
      totals = { partsSubtotal; laborSubtotal; subtotal; taxRate; tax; total = subtotal + tax };
    };
  };

  public func convertQuoteToInvoice(state : State, id : Common.Id, paymentMethod : BillingTypes.PaymentMethod, performedBy : Principal) : BillingTypes.Invoice {
    ignore performedBy;
    let quote = findQuote(state, id);
    if (quote.status != #accepted) {
      Runtime.trap("Solo se puede convertir una cotización aceptada");
    };
    let lines = List.empty<BillingTypes.InvoiceLine>();
    for (line in quote.partLines.values()) {
      lines.add({
        description = line.description;
        quantity = line.quantity;
        unitPrice = line.unitPrice;
        amount = line.quantity * line.unitPrice;
        kind = #part;
        unitCost = 0;
      });
    };
    for (line in quote.serviceLines.values()) {
      lines.add({
        description = line.description;
        quantity = line.quantity;
        unitPrice = line.unitPrice;
        amount = line.quantity * line.unitPrice;
        kind = #service;
        unitCost = 0;
      });
    };
    let invoiceLines = lines.toArray();
    var subtotal = 0;
    for (line in invoiceLines.values()) {
      subtotal += line.amount;
    };
    let discount = quote.discount;
    let taxableBase = if (discount >= subtotal) { 0 } else { subtotal - discount };
    let taxRate = effectiveTaxRate(state);
    let tax = (taxableBase * taxRate) / 100;
    let invoiceId = state.counters.nextInvoiceId;
    state.counters.nextInvoiceId := invoiceId + 1;
    let number = state.counters.nextInvoiceNumber;
    state.counters.nextInvoiceNumber := number + 1;
    let customerName = switch (state.customers.get(quote.customerId)) {
      case (?customer) { customer.name };
      case null { "" };
    };
    let customerTaxId = switch (state.customers.get(quote.customerId)) {
      case (?customer) { customer.document };
      case null { null };
    };
    let customerAddress = switch (state.customers.get(quote.customerId)) {
      case (?customer) { customer.address };
      case null { null };
    };
    let invoice : BillingTypes.Invoice = {
      id = invoiceId;
      number = invoiceNumberFor(number);
      origin = #quote;
      orderId = null;
      posSaleId = null;
      customerId = ?quote.customerId;
      customerName;
      customerTaxId;
      customerAddress;
      lines = invoiceLines;
      subtotal;
      discount;
      taxRate;
      tax;
      total = taxableBase + tax;
      paymentMethod;
      paymentCondition = #cash;
      paymentStatus = #pending;
      installments = null;
      issuedAt = Time.now();
    };
    state.invoices.add(invoiceId, invoice);
    invoice;
  };

  public func computeTotals(state : State, quote : Types.Quote) : Types.QuoteTotals {
    var partsSubtotal = 0;
    for (line in quote.partLines.values()) {
      partsSubtotal += line.quantity * line.unitPrice;
    };
    var servicesSubtotal = 0;
    for (line in quote.serviceLines.values()) {
      servicesSubtotal += line.quantity * line.unitPrice;
    };
    let subtotal = partsSubtotal + servicesSubtotal;
    let discount = quote.discount;
    let taxableBase = if (discount >= subtotal) { 0 } else { subtotal - discount };
    // El régimen fiscal vigente manda: una empresa no responsable de IVA no
    // aplica impuesto aunque la cotización conserve una tarifa guardada.
    let taxRate = effectiveTaxRate(state);
    let tax = (taxableBase * taxRate) / 100;
    {
      partsSubtotal;
      servicesSubtotal;
      subtotal;
      discount;
      taxableBase;
      taxRate;
      tax;
      total = taxableBase + tax;
    };
  };
};
