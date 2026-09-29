import List "mo:core/List";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";

import Common "../types/common";
import Types "../types/cash";
import BillingTypes "../types/billing";

module {
  // Contadores del dominio de Caja y Bancos.
  public type Counters = {
    var nextShiftId : Nat;
    var nextCashMovementId : Nat;
  };

  // Estado del dominio de Caja y Bancos.
  public type State = {
    shifts : Map.Map<Common.Id, Types.Shift>;
    cashMovements : Map.Map<Common.Id, Types.CashMovement>;
    counters : Counters;
  };

  // Totales de un turno por cuenta y naturaleza del movimiento.
  type ShiftTotals = {
    cashIncome : Nat;
    cashExpense : Nat;
    bankIncome : Nat;
    bankExpense : Nat;
  };

  func shiftTotals(state : State, shiftId : Common.Id) : ShiftTotals {
    var cashIncome = 0;
    var cashExpense = 0;
    var bankIncome = 0;
    var bankExpense = 0;
    for (movement in state.cashMovements.values()) {
      if (movement.shiftId == shiftId) {
        switch (movement.account) {
          case (#cash) {
            switch (movement.kind) {
              case (#income) { cashIncome += movement.amount };
              case (#expense) { cashExpense += movement.amount };
            };
          };
          case (#bank) {
            switch (movement.kind) {
              case (#income) { bankIncome += movement.amount };
              case (#expense) { bankExpense += movement.amount };
            };
          };
        };
      };
    };
    { cashIncome; cashExpense; bankIncome; bankExpense };
  };

  // Saldo final calculado de una cuenta: saldo inicial + ingresos − egresos.
  // Se calcula en `Int` y se acota a cero porque `Money` es `Nat`.
  func computedClosing(opening : Common.Money, income : Common.Money, expense : Common.Money) : Common.Money {
    let value = opening.toInt() + income.toInt() - expense.toInt();
    if (value < 0) { 0 } else { value.toNat() };
  };

  // Cuenta afectada por un movimiento, derivada del medio de pago: el efectivo
  // afecta Caja; transferencia y tarjeta afectan Bancos. `#mixed` es ambiguo y
  // respeta la cuenta indicada por el llamador.
  func accountFor(paymentMethod : BillingTypes.PaymentMethod, requested : Types.CashAccount) : Types.CashAccount {
    switch (paymentMethod) {
      case (#cash) { #cash };
      case (#transfer) { #bank };
      case (#card) { #bank };
      case (#mixed) { requested };
    };
  };

  // Abre un turno con los saldos iniciales declarados. Falla si ya hay un
  // turno abierto.
  public func openShift(state : State, input : Types.OpenShiftInput, performedBy : Principal) : Types.Shift {
    switch (getOpenShift(state)) {
      case (?_) { Runtime.trap("Ya hay un turno de caja abierto") };
      case null {};
    };
    let id = state.counters.nextShiftId;
    state.counters.nextShiftId := id + 1;
    let shift : Types.Shift = {
      id;
      openedAt = Time.now();
      closedAt = null;
      openingCash = input.openingCash;
      openingBank = input.openingBank;
      declaredClosingCash = null;
      declaredClosingBank = null;
      computedClosingCash = input.openingCash;
      computedClosingBank = input.openingBank;
      differenceCash = 0;
      differenceBank = 0;
      status = #open;
      openedBy = performedBy;
      closedBy = null;
      notes = input.notes;
    };
    state.shifts.add(id, shift);
    shift;
  };

  // Cierra un turno: guarda los saldos finales declarados y calcula la
  // diferencia contra los saldos esperados. Falla si el turno no existe o ya
  // está cerrado.
  public func closeShift(state : State, id : Common.Id, input : Types.CloseShiftInput, performedBy : Principal) : Types.Shift {
    let shift = state.shifts.get(id) ?? Runtime.trap("Turno no encontrado");
    switch (shift.status) {
      case (#closed) { Runtime.trap("El turno ya está cerrado") };
      case (#open) {};
    };
    let totals = shiftTotals(state, id);
    let computedCash = computedClosing(shift.openingCash, totals.cashIncome, totals.cashExpense);
    let computedBank = computedClosing(shift.openingBank, totals.bankIncome, totals.bankExpense);
    let updated : Types.Shift = {
      shift with
      closedAt = ?Time.now();
      declaredClosingCash = ?input.declaredClosingCash;
      declaredClosingBank = ?input.declaredClosingBank;
      computedClosingCash = computedCash;
      computedClosingBank = computedBank;
      differenceCash = input.declaredClosingCash.toInt() - computedCash.toInt();
      differenceBank = input.declaredClosingBank.toInt() - computedBank.toInt();
      status = #closed;
      closedBy = ?performedBy;
      notes = input.notes;
    };
    state.shifts.add(id, updated);
    updated;
  };

  // Lista turnos paginados, ordenados por id descendente.
  public func listShifts(state : State, filter : Types.ShiftFilter, offset : Nat, limit : Nat) : Types.ShiftPage {
    let matched = List.empty<Types.Shift>();
    for (shift in state.shifts.values()) {
      let statusOk = switch (filter.status) {
        case null { true };
        case (?wanted) { shift.status == wanted };
      };
      let fromOk = switch (filter.from) {
        case null { true };
        case (?from) { shift.openedAt >= from };
      };
      let toOk = switch (filter.to) {
        case null { true };
        case (?to) { shift.openedAt <= to };
      };
      if (statusOk and fromOk and toOk) { matched.add(shift) };
    };
    let sorted = matched.toArray().sort(func (a, b) = Nat.compare(b.id, a.id));
    let total = sorted.size();
    let start = if (offset > total) { total } else { offset };
    let end = Nat.min(start + limit, total);
    { items = sorted.sliceToArray(start, end); total; offset; limit };
  };

  // Devuelve un turno por id, o null si no existe.
  public func getShift(state : State, id : Common.Id) : ?Types.Shift {
    state.shifts.get(id);
  };

  // Devuelve el turno abierto actual, o null si no hay ninguno. Si por alguna
  // razón hubiera más de uno, devuelve el de id mayor.
  public func getOpenShift(state : State) : ?Types.Shift {
    var found : ?Types.Shift = null;
    for (shift in state.shifts.values()) {
      if (shift.status == #open) {
        switch (found) {
          case null { found := ?shift };
          case (?current) { if (shift.id > current.id) { found := ?shift } };
        };
      };
    };
    found;
  };

  // Registra un movimiento de tesorería en el turno abierto. Falla si no hay
  // turno abierto o si el monto es 0.
  public func registerCashMovement(state : State, input : Types.CashMovementInput, performedBy : Principal) : Types.CashMovement {
    ignore performedBy;
    let shift = getOpenShift(state) ?? Runtime.trap("No hay un turno de caja abierto");
    if (input.amount == 0) {
      Runtime.trap("El monto del movimiento debe ser mayor que cero");
    };
    let id = state.counters.nextCashMovementId;
    state.counters.nextCashMovementId := id + 1;
    let movement : Types.CashMovement = {
      id;
      shiftId = shift.id;
      timestamp = Time.now();
      kind = input.kind;
      paymentMethod = input.paymentMethod;
      amount = input.amount;
      account = accountFor(input.paymentMethod, input.account);
      description = input.description;
      reference = input.reference;
      source = input.source;
    };
    state.cashMovements.add(id, movement);
    movement;
  };

  // Lista movimientos paginados, ordenados por id descendente.
  public func listCashMovements(state : State, filter : Types.CashMovementFilter, offset : Nat, limit : Nat) : Types.CashMovementPage {
    let matched = List.empty<Types.CashMovement>();
    for (movement in state.cashMovements.values()) {
      let shiftOk = switch (filter.shiftId) {
        case null { true };
        case (?shiftId) { movement.shiftId == shiftId };
      };
      let kindOk = switch (filter.kind) {
        case null { true };
        case (?kind) { movement.kind == kind };
      };
      let accountOk = switch (filter.account) {
        case null { true };
        case (?account) { movement.account == account };
      };
      let methodOk = switch (filter.paymentMethod) {
        case null { true };
        case (?method) { movement.paymentMethod == method };
      };
      let fromOk = switch (filter.from) {
        case null { true };
        case (?from) { movement.timestamp >= from };
      };
      let toOk = switch (filter.to) {
        case null { true };
        case (?to) { movement.timestamp <= to };
      };
      if (shiftOk and kindOk and accountOk and methodOk and fromOk and toOk) {
        matched.add(movement);
      };
    };
    let sorted = matched.toArray().sort(func (a, b) = Nat.compare(b.id, a.id));
    let total = sorted.size();
    let start = if (offset > total) { total } else { offset };
    let end = Nat.min(start + limit, total);
    { items = sorted.sliceToArray(start, end); total; offset; limit };
  };

  // Informe diario de un turno: todos sus movimientos, totales por medio de
  // pago y saldos finales. Falla si el turno no existe.
  public func getDailyShiftReport(state : State, shiftId : Common.Id) : Types.DailyShiftReport {
    let shift = state.shifts.get(shiftId) ?? Runtime.trap("Turno no encontrado");
    let movements = List.empty<Types.CashMovement>();
    for (movement in state.cashMovements.values()) {
      if (movement.shiftId == shiftId) { movements.add(movement) };
    };
    let sorted = movements.toArray().sort(func (a, b) = Nat.compare(a.id, b.id));

    // Totales por medio de pago, en orden de primera aparición.
    let methods = List.empty<BillingTypes.PaymentMethod>();
    let methodIncome = List.empty<Nat>();
    let methodExpense = List.empty<Nat>();
    for (movement in sorted.values()) {
      var found = false;
      var i = 0;
      for (existing in methods.values()) {
        if (existing == movement.paymentMethod) {
          switch (movement.kind) {
            case (#income) { methodIncome.put(i, methodIncome.at(i) + movement.amount) };
            case (#expense) { methodExpense.put(i, methodExpense.at(i) + movement.amount) };
          };
          found := true;
        };
        i += 1;
      };
      if (not found) {
        methods.add(movement.paymentMethod);
        methodIncome.add(switch (movement.kind) { case (#income) { movement.amount }; case (#expense) { 0 } });
        methodExpense.add(switch (movement.kind) { case (#expense) { movement.amount }; case (#income) { 0 } });
      };
    };
    let byPaymentMethod = List.empty<Types.PaymentMethodTotal>();
    var j = 0;
    for (method in methods.values()) {
      byPaymentMethod.add({
        method;
        income = methodIncome.at(j);
        expense = methodExpense.at(j);
      });
      j += 1;
    };

    let totals = shiftTotals(state, shiftId);
    {
      shift;
      movements = sorted;
      byPaymentMethod = byPaymentMethod.toArray();
      totalIncome = totals.cashIncome + totals.bankIncome;
      totalExpense = totals.cashExpense + totals.bankExpense;
      cashIncome = totals.cashIncome;
      cashExpense = totals.cashExpense;
      bankIncome = totals.bankIncome;
      bankExpense = totals.bankExpense;
    };
  };
};
