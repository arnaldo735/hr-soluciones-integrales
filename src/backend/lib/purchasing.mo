import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import Types "../types/purchasing";
import InventoryTypes "../types/inventory";

module {
  public type State = {
    suppliers : Map.Map<Types.Id, Types.Supplier>;
    purchases : Map.Map<Types.Id, Types.Purchase>;
    payments : Map.Map<Types.Id, Types.Payment>;
    lots : Map.Map<Types.Id, InventoryTypes.Lot>;
    movements : Map.Map<Types.Id, InventoryTypes.Movement>;
    counters : {
      var nextSupplierId : Nat;
      var nextPurchaseId : Nat;
      var nextPurchaseItemId : Nat;
      var nextPaymentId : Nat;
      var nextLotId : Nat;
      var nextMovementId : Nat;
    };
  };

  func matches(haystack : Text, needle : Text) : Bool {
    haystack.toLower().contains(#text needle);
  };

  func supplierMatches(s : Types.Supplier, needle : Text) : Bool {
    matches(s.name, needle)
      or (switch (s.contactName) { case (?v) matches(v, needle); case null false })
      or matches(s.phone, needle)
      or (switch (s.email) { case (?v) matches(v, needle); case null false })
      or (switch (s.taxId) { case (?v) matches(v, needle); case null false })
      or (switch (s.address) { case (?v) matches(v, needle); case null false });
  };

  // Vencimiento de una cuenta por pagar: la compra pendiente más antigua más
  // el plazo de crédito (30 días, la misma convención de mes que usa el módulo
  // de facturación). Sin compras pendientes, el vencimiento es la fecha de la
  // compra más reciente (o 0 si el proveedor no tiene compras).

  public func listSuppliers(state : State, search : ?Text) : [Types.Supplier] {
    let all = state.suppliers.values().toArray();
    let filtered = switch (search) {
      case null { all };
      case (?term) {
        let trimmed = term.trim(#predicate (func (c : Char) : Bool = c == ' '));
        if (trimmed == "") { all } else {
          let needle = trimmed.toLower();
          all.filter(func s = supplierMatches(s, needle));
        };
      };
    };
    filtered.sort(func (a, b) = Nat.compare(a.id, b.id));
  };

  public func getSupplier(state : State, id : Types.Id) : ?Types.Supplier {
    state.suppliers.get(id);
  };

  public func createSupplier(state : State, input : Types.SupplierInput) : Types.Supplier {
    let id = state.counters.nextSupplierId;
    state.counters.nextSupplierId := id + 1;
    let supplier : Types.Supplier = {
      id;
      name = input.name;
      contactName = input.contactName;
      phone = input.phone;
      email = input.email;
      taxId = input.taxId;
      address = input.address;
      createdAt = Time.now();
    };
    state.suppliers.add(id, supplier);
    supplier;
  };

  public func updateSupplier(state : State, id : Types.Id, input : Types.SupplierInput) : Types.Supplier {
    let existing = state.suppliers.get(id) ?? Runtime.trap("Supplier not found");
    let updated : Types.Supplier = {
      existing with
      name = input.name;
      contactName = input.contactName;
      phone = input.phone;
      email = input.email;
      taxId = input.taxId;
      address = input.address;
    };
    state.suppliers.add(id, updated);
    updated;
  };

  public func listPurchases(state : State, supplierId : ?Types.Id) : [Types.Purchase] {
    let all = state.purchases.values().toArray();
    let filtered = switch (supplierId) {
      case null { all };
      case (?sid) { all.filter(func p = p.supplierId == sid) };
    };
    filtered.sort(func (a, b) = Nat.compare(a.id, b.id));
  };

  public func createPurchase(state : State, input : Types.PurchaseInput, performedBy : Principal) : Types.Purchase {
    ignore state.suppliers.get(input.supplierId) ?? Runtime.trap("Supplier not found");
    let now = Time.now();
    var total = 0;
    let items = input.items.map(
      func (item) : Types.PurchaseItem {
        let itemId = state.counters.nextPurchaseItemId;
        state.counters.nextPurchaseItemId := itemId + 1;
        total += item.quantity * item.unitCost;
        {
          id = itemId;
          partId = item.partId;
          lotNumber = item.lotNumber;
          quantity = item.quantity;
          unitCost = item.unitCost;
        };
      }
    );
    let purchaseId = state.counters.nextPurchaseId;
    state.counters.nextPurchaseId := purchaseId + 1;
    let purchase : Types.Purchase = {
      id = purchaseId;
      supplierId = input.supplierId;
      items;
      total;
      paidAmount = 0;
      createdAt = now;
    };
    state.purchases.add(purchaseId, purchase);

    for (item in items.values()) {
      let lotId = state.counters.nextLotId;
      state.counters.nextLotId := lotId + 1;
      let lot : InventoryTypes.Lot = {
        id = lotId;
        partId = item.partId;
        lotNumber = item.lotNumber;
        quantity = item.quantity;
        unitCost = item.unitCost;
        supplierId = ?input.supplierId;
        purchaseId = ?purchaseId;
        receivedAt = now;
      };
      state.lots.add(lotId, lot);

      let movementId = state.counters.nextMovementId;
      state.counters.nextMovementId := movementId + 1;
      let movement : InventoryTypes.Movement = {
        id = movementId;
        partId = item.partId;
        lotId = ?lotId;
        kind = #purchase;
        quantity = item.quantity;
        unitCost = ?item.unitCost;
        reason = ?("Compra a proveedor");
        referenceId = ?purchaseId;
        performedBy;
        at = now;
      };
      state.movements.add(movementId, movement);
    };

    purchase;
  };

  public func listPayments(state : State, supplierId : ?Types.Id) : [Types.Payment] {
    let all = state.payments.values().toArray();
    let filtered = switch (supplierId) {
      case null { all };
      case (?sid) { all.filter(func p = p.supplierId == sid) };
    };
    filtered.sort(func (a, b) = Nat.compare(a.id, b.id));
  };

  public func registerPayment(state : State, input : Types.PaymentInput, performedBy : Principal) : Types.Payment {
    ignore state.suppliers.get(input.supplierId) ?? Runtime.trap("Supplier not found");
    if (input.amount == 0) { Runtime.trap("Payment amount must be greater than zero") };
    switch (input.purchaseId) {
      case null {};
      case (?pid) {
        let purchase = state.purchases.get(pid) ?? Runtime.trap("Purchase not found");
        if (purchase.supplierId != input.supplierId) {
          Runtime.trap("Purchase does not belong to the supplier");
        };
      };
    };
    let id = state.counters.nextPaymentId;
    state.counters.nextPaymentId := id + 1;
    let payment : Types.Payment = {
      id;
      supplierId = input.supplierId;
      purchaseId = input.purchaseId;
      amount = input.amount;
      method = input.method;
      note = input.note;
      performedBy;
      at = Time.now();
    };
    state.payments.add(id, payment);

    switch (input.purchaseId) {
      case null {};
      case (?pid) {
        switch (state.purchases.get(pid)) {
          case (?purchase) {
            state.purchases.add(pid, { purchase with paidAmount = purchase.paidAmount + input.amount });
          };
          case null {};
        };
      };
    };

    payment;
  };

  // Agregados de cuentas por pagar por proveedor en un solo recorrido de las
  // compras y otro de los pagos. Evita recorrer compras y pagos una vez por
  // proveedor evaluado.
  type PayableAggregate = {
    totalPurchased : Nat;
    totalPaid : Nat;
    oldestUnpaid : ?Types.Timestamp;
    latestPurchase : ?Types.Timestamp;
  };

  func payableAggregates(state : State) : Map.Map<Types.Id, PayableAggregate> {
    let aggregates = Map.empty<Types.Id, PayableAggregate>();
    for (p in state.purchases.values()) {
      let current = aggregates.get(p.supplierId) ?? ({
        totalPurchased = 0;
        totalPaid = 0;
        oldestUnpaid = null;
        latestPurchase = null;
      } : PayableAggregate);
      let latest = switch (current.latestPurchase) {
        case null { ?p.createdAt };
        case (?v) { if (p.createdAt > v) { ?p.createdAt } else { ?v } };
      };
      let oldest = if (p.paidAmount < p.total) {
        switch (current.oldestUnpaid) {
          case null { ?p.createdAt };
          case (?v) { if (p.createdAt < v) { ?p.createdAt } else { ?v } };
        };
      } else {
        current.oldestUnpaid;
      };
      aggregates.add(p.supplierId, {
        totalPurchased = current.totalPurchased + p.total;
        totalPaid = current.totalPaid;
        oldestUnpaid = oldest;
        latestPurchase = latest;
      });
    };
    for (p in state.payments.values()) {
      let current = aggregates.get(p.supplierId) ?? ({
        totalPurchased = 0;
        totalPaid = 0;
        oldestUnpaid = null;
        latestPurchase = null;
      } : PayableAggregate);
      aggregates.add(p.supplierId, { current with totalPaid = current.totalPaid + p.amount });
    };
    aggregates
  };

  func payableFrom(s : Types.Supplier, aggregate : PayableAggregate) : Types.Payable {
    let creditTermNs : Int = 30 * 24 * 60 * 60 * 1_000_000_000;
    let totalPurchased = aggregate.totalPurchased;
    let totalPaid = aggregate.totalPaid;
    let balance = if (totalPaid >= totalPurchased) { 0 } else { totalPurchased - totalPaid };
    let dueDate = switch (aggregate.oldestUnpaid) {
      case (?at) { at + creditTermNs };
      case null { aggregate.latestPurchase ?? 0 };
    };
    let status : Types.PayableStatus = if (balance == 0) {
      #paid;
    } else if (dueDate < Time.now()) {
      #overdue;
    } else {
      #pending;
    };
    {
      supplierId = s.id;
      supplierName = s.name;
      totalPurchased;
      totalPaid;
      balance;
      dueDate;
      status;
    };
  };

  func emptyAggregate() : PayableAggregate {
    { totalPurchased = 0; totalPaid = 0; oldestUnpaid = null; latestPurchase = null };
  };

  public func listPayables(state : State) : [Types.Payable] {
    let aggregates = payableAggregates(state);
    let suppliers = state.suppliers.values().toArray().sort(func (a, b) = Nat.compare(a.id, b.id));
    suppliers.map(func s = payableFrom(s, aggregates.get(s.id) ?? emptyAggregate()));
  };

  public func getPayable(state : State, supplierId : Types.Id) : ?Types.Payable {
    switch (state.suppliers.get(supplierId)) {
      case null { null };
      case (?s) { ?payableFrom(s, payableAggregates(state).get(supplierId) ?? emptyAggregate()) };
    };
  };
};
