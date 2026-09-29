import List "mo:core/List";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";

import Common "../types/common";
import Types "../types/pos";
import InventoryTypes "../types/inventory";
import CustomerTypes "../types/customers";
import BillingTypes "../types/billing";
import CompanyTypes "../types/company";
import Search "../lib/search";

module {
  public type Counters = {
    var nextPosSaleId : Nat;
    var nextPosSaleNumber : Nat;
    var nextMovementId : Nat;
    var nextInvoiceId : Nat;
    var nextInvoiceNumber : Nat;
  };

  public type State = {
    posSales : Map.Map<Common.Id, Types.PosSale>;
    parts : Map.Map<Common.Id, InventoryTypes.Part>;
    lots : Map.Map<Common.Id, InventoryTypes.Lot>;
    movements : Map.Map<Common.Id, InventoryTypes.Movement>;
    customers : Map.Map<Common.Id, CustomerTypes.Customer>;
    invoices : Map.Map<Common.Id, BillingTypes.Invoice>;
    businessSettings : { var settings : BillingTypes.BusinessSettings };
    company : { var profile : CompanyTypes.CompanyProfile };
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

  func saleNumberFor(n : Nat) : Text {
    "POS-" # padNumber(n);
  };

  func invoiceNumberFor(n : Nat) : Text {
    "F-" # padNumber(n);
  };

  func totalAvailable(state : State, partId : Common.Id) : Nat {
    var total = 0;
    for (lot in state.lots.values()) {
      if (lot.partId == partId) { total += lot.quantity };
    };
    total;
  };

  func recordMovement(
    state : State,
    partId : Common.Id,
    lotId : ?Common.Id,
    kind : InventoryTypes.MovementKind,
    quantity : Nat,
    unitCost : ?Common.Money,
    reason : ?Text,
    referenceId : ?Common.Id,
    performedBy : Principal,
  ) : () {
    let id = state.counters.nextMovementId;
    state.counters.nextMovementId := id + 1;
    state.movements.add(id, {
      id;
      partId;
      lotId;
      kind;
      quantity;
      unitCost;
      reason;
      referenceId;
      performedBy;
      at = Time.now();
    });
  };

  func deductFromAvailableLots(
    state : State,
    partId : Common.Id,
    quantity : Nat,
    performedBy : Principal,
    referenceId : Common.Id,
  ) : () {
    var remaining = quantity;
    let lotIds = List.empty<Common.Id>();
    for (lot in state.lots.values()) {
      if (lot.partId == partId) { lotIds.add(lot.id) };
    };
    let sorted = lotIds.toArray().sort(func (a, b) = Nat.compare(a, b));
    for (lotId in sorted.values()) {
      if (remaining > 0) {
        switch (state.lots.get(lotId)) {
          case (?lot) {
            let take = if (lot.quantity <= remaining) { lot.quantity } else { remaining };
            if (take > 0) {
              state.lots.add(lotId, { lot with quantity = lot.quantity - take });
              recordMovement(state, partId, ?lotId, #sale, take, ?lot.unitCost, ?"Venta de mostrador", ?referenceId, performedBy);
              remaining -= take;
            };
          };
          case null {};
        };
      };
    };
  };

  // Construye el plan de cuotas de una venta a crédito. Las cuotas son de
  // igual valor y suman exactamente el total: el residuo de la división entera
  // se reparte en las primeras cuotas. Los vencimientos van mes a mes desde
  // `firstDueDate`.
  func buildInstallmentPlan(plan : ?BillingTypes.CreditPlanInput, total : Common.Money) : BillingTypes.InstallmentPlan {
    let input = plan ?? Runtime.trap("El plan de cuotas es obligatorio para una venta a crédito");
    if (input.installmentCount == 0) {
      Runtime.trap("El número de cuotas debe ser mayor que cero");
    };
    let count = input.installmentCount;
    let base = total / count;
    let remainder = total % count;
    let installments = List.empty<BillingTypes.Installment>();
    var index = 0;
    while (index < count) {
      let amount = if (index < remainder) { base + 1 } else { base };
      installments.add({
        number = index + 1;
        amount;
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

  func matches(sale : Types.PosSale, filter : Types.PosSaleFilter) : Bool {    let searchOk = switch (filter.search) {
      case null { true };
      case (?term) {
        let needle = Search.normalize(term);
        if (needle == "") { true } else {
          let customerOk = switch (sale.customerName) {
            case (?name) { Search.contains(name, needle) };
            case null { false };
          };
          Search.contains(sale.saleNumber, needle) or customerOk;
        };
      };
    };
    let fromOk = switch (filter.from) {
      case null { true };
      case (?from) { sale.soldAt >= from };
    };
    let toOk = switch (filter.to) {
      case null { true };
      case (?to) { sale.soldAt <= to };
    };
    searchOk and fromOk and toOk;
  };

  // --- public API ----------------------------------------------------------

  public func listPosSales(state : State, filter : Types.PosSaleFilter, offset : Nat, limit : Nat) : Types.PosSalePage {
    let matched = List.empty<Types.PosSale>();
    for (sale in state.posSales.values()) {
      if (matches(sale, filter)) { matched.add(sale) };
    };
    let sorted = matched.toArray().sort(func (a, b) = Nat.compare(b.id, a.id));
    let total = sorted.size();
    let start = if (offset > total) { total } else { offset };
    let end = Nat.min(start + limit, total);
    { items = sorted.sliceToArray(start, end); total; offset; limit };
  };

  public func getPosSale(state : State, id : Common.Id) : ?Types.PosSale {
    state.posSales.get(id);
  };

  public func createPosSale(state : State, input : Types.PosSaleInput, performedBy : Principal) : Types.PosSale {
    if (input.lines.size() == 0) {
      Runtime.trap("emptyCart");
    };

    // Una venta a crédito exige un cliente registrado.
    let credit = switch (input.paymentCondition) {
      case (#credit) { true };
      case (#cash) { false };
    };
    if (credit) {
      switch (input.customerId) {
        case null { Runtime.trap("Una venta a crédito requiere un cliente registrado") };
        case (?customerId) {
          ignore state.customers.get(customerId) ?? Runtime.trap("Cliente no encontrado");
        };
      };
    };

    // 1. Validate every line against available stock before mutating anything.
    for (line in input.lines.values()) {
      let available = totalAvailable(state, line.partId);
      if (line.quantity > available) {
        Runtime.trap(
          "insufficientStock: part " # line.partId.toText()
          # ", available " # available.toText()
          # ", requested " # line.quantity.toText()
        );
      };
    };

    // 2. Build the sale lines and compute totals.
    let saleLines = List.empty<Types.PosSaleLine>();
    var subtotal = 0;
    var lineDiscountTotal = 0;
    for (line in input.lines.values()) {
      let unitPrice = switch (state.parts.get(line.partId)) {
        case (?part) { part.salePrice };
        case null { 0 };
      };
      let description = switch (state.parts.get(line.partId)) {
        case (?part) { part.name };
        case null { "Repuesto #" # line.partId.toText() };
      };
      let gross = line.quantity * unitPrice;
      let discount = if (line.discount > gross) { gross } else { line.discount };
      let amount = gross - discount;
      subtotal += gross;
      lineDiscountTotal += discount;
      saleLines.add({
        partId = line.partId;
        description;
        quantity = line.quantity;
        unitPrice;
        discount;
        amount;
      });
    };

    let taxableBase = subtotal - lineDiscountTotal;
    // El régimen fiscal de la empresa decide si la venta lleva IVA; la tarifa
    // configurada vive en el perfil de empresa.
    let taxRate = CompanyTypes.effectiveTaxRate(state.company.profile, state.company.profile.taxRate);
    let tax = (taxableBase * taxRate) / 100;
    let total = taxableBase + tax;

    // 3. Cash sales must cover the total.
    if (not credit and input.paymentMethod == "cash" and input.amountReceived < total) {
      Runtime.trap(
        "insufficientPayment: total " # total.toText()
        # ", received " # input.amountReceived.toText()
      );
    };

    let now = Time.now();
    let saleId = state.counters.nextPosSaleId;
    state.counters.nextPosSaleId := saleId + 1;
    let saleNumberSeq = state.counters.nextPosSaleNumber;
    state.counters.nextPosSaleNumber := saleNumberSeq + 1;

    // 4. Decrement stock and record movements.
    for (line in saleLines.toArray().values()) {
      deductFromAvailableLots(state, line.partId, line.quantity, performedBy, saleId);
    };

    // 5. Create the direct invoice (origin #pos, no workshop order).
    let invoiceLines = saleLines.toArray().map(
      func (line) : BillingTypes.InvoiceLine {
        {
          description = line.description;
          quantity = line.quantity;
          unitPrice = line.unitPrice;
          amount = line.amount;
          kind = #part;
          unitCost = 0;
        };
      }
    );
    let invoiceId = state.counters.nextInvoiceId;
    state.counters.nextInvoiceId := invoiceId + 1;
    let invoiceNumberSeq = state.counters.nextInvoiceNumber;
    state.counters.nextInvoiceNumber := invoiceNumberSeq + 1;
    let customerName = switch (input.customerId) {
      case null { null };
      case (?customerId) {
        switch (state.customers.get(customerId)) {
          case (?customer) { ?customer.name };
          case null { null };
        };
      };
    };
    let customerTaxId = switch (input.customerId) {
      case null { null };
      case (?customerId) {
        switch (state.customers.get(customerId)) {
          case (?customer) { customer.document };
          case null { null };
        };
      };
    };
    let customerAddress = switch (input.customerId) {
      case null { null };
      case (?customerId) {
        switch (state.customers.get(customerId)) {
          case (?customer) { customer.address };
          case null { null };
        };
      };
    };
    let paymentMethod : BillingTypes.PaymentMethod = switch (input.paymentMethod) {
      case ("card") { #card };
      case ("transfer") { #transfer };
      case (_) { #cash };
    };
    let invoice : BillingTypes.Invoice = {
      id = invoiceId;
      number = invoiceNumberFor(invoiceNumberSeq);
      origin = #pos;
      orderId = null;
      posSaleId = ?saleId;
      customerId = input.customerId;
      customerName = customerName ?? "Cliente de mostrador";
      customerTaxId;
      customerAddress;
      lines = invoiceLines;
      subtotal;
      discount = lineDiscountTotal;
      taxRate;
      tax;
      total;
      paymentMethod;
      paymentCondition = input.paymentCondition;
      paymentStatus = if (credit) { #pending } else { #paid };
      installments = if (credit) { ?buildInstallmentPlan(input.creditPlan, total) } else { null };
      issuedAt = now;
    };
    state.invoices.add(invoiceId, invoice);

    // 6. Record the POS sale.
    let change = if (credit or input.amountReceived <= total) { 0 } else { input.amountReceived - total };
    let sale : Types.PosSale = {
      id = saleId;
      saleNumber = saleNumberFor(saleNumberSeq);
      customerId = input.customerId;
      customerName;
      lines = saleLines.toArray();
      subtotal;
      discount = lineDiscountTotal;
      taxRate;
      tax;
      total;
      paymentMethod = input.paymentMethod;
      paymentCondition = input.paymentCondition;
      amountReceived = input.amountReceived;
      change;
      invoiceId;
      soldBy = performedBy;
      soldAt = now;
    };
    state.posSales.add(saleId, sale);
    sale;
  };
};
