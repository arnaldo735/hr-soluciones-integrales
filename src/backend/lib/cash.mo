import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";

import Common "../types/common";
import Billing "../types/billing";
import Types "../types/cash";

module {
  // Contadores del dominio de Caja y Bancos.
  public type Counters = {
    var nextShiftId : Nat;
    var nextCashMovementId : Nat;
    var nextCashRegisterId : Nat;
  };

  // Estado del dominio de Caja y Bancos.
  public type State = {
    cashRegisters : Map.Map<Common.Id, Types.CashRegister>;
    shifts : Map.Map<Common.Id, Types.Shift>;
    cashMovements : Map.Map<Common.Id, Types.CashMovement>;
    counters : Counters;
  };

  // Normaliza un texto para comparar/buscar ignorando mayúsculas y tildes.
  func normalize(text : Text) : Text {
    let lowered = text.toLower();
    let chars = lowered.toArray();
    let mapped = chars.map(
      func(c) {
        switch (c) {
          case ('á') { 'a' };
          case ('é') { 'e' };
          case ('í') { 'i' };
          case ('ó') { 'o' };
          case ('ú') { 'u' };
          case ('ü') { 'u' };
          case ('ñ') { 'n' };
          case (_) { c };
        };
      }
    );
    Text.fromArray(mapped);
  };

  func sameKind(a : Types.CashRegisterKind, b : Types.CashRegisterKind) : Bool {
    switch (a, b) {
      case (#cash, #cash) { true };
      case (#bank, #bank) { true };
      case (_) { false };
    };
  };

  func sameStatus(a : Types.ShiftStatus, b : Types.ShiftStatus) : Bool {
    switch (a, b) {
      case (#open, #open) { true };
      case (#closed, #closed) { true };
      case (_) { false };
    };
  };

  func sameAccount(a : Types.CashAccount, b : Types.CashAccount) : Bool {
    switch (a, b) {
      case (#cash, #cash) { true };
      case (#bank, #bank) { true };
      case (_) { false };
    };
  };

  func sameMovementKind(a : Types.CashMovementKind, b : Types.CashMovementKind) : Bool {
    switch (a, b) {
      case (#income, #income) { true };
      case (#expense, #expense) { true };
      case (_) { false };
    };
  };

  func samePaymentMethod(a : Billing.PaymentMethod, b : Billing.PaymentMethod) : Bool {
    switch (a, b) {
      case (#cash, #cash) { true };
      case (#card, #card) { true };
      case (#transfer, #transfer) { true };
      case (#mixed, #mixed) { true };
      case (_) { false };
    };
  };

  // Cuenta afectada por un movimiento según su medio de pago. `#mixed` respeta
  // la cuenta solicitada; el resto se deriva del medio. Público para que los
  // flujos de venta (POS, facturación, cartera) deriven la cuenta con la misma
  // regla que anticipos y abonos.
  public func accountFor(paymentMethod : Billing.PaymentMethod, requested : Types.CashAccount) : Types.CashAccount {
    switch (paymentMethod) {
      case (#cash) { #cash };
      case (#transfer) { #bank };
      case (#card) { #bank };
      case (#mixed) { requested };
    };
  };

  // ── Catálogo de cajas y bancos ──────────────────────────────────────────

  public func createCashRegister(state : State, input : Types.CashRegisterInput) : Types.CashRegister {
    let name = input.name.trim(#char ' ');
    if (name == "") {
      Runtime.trap("El nombre de la caja o banco es obligatorio");
    };
    let normalized = normalize(name);
    let duplicate = state.cashRegisters.values().any(
      func(register) { normalize(register.name) == normalized }
    );
    if (duplicate) {
      Runtime.trap("Ya existe una caja o banco con ese nombre");
    };
    let id = state.counters.nextCashRegisterId;
    state.counters.nextCashRegisterId := id + 1;
    let now = Time.now();
    let register : Types.CashRegister = {
      id;
      name;
      kind = input.kind;
      openingBalance = input.openingBalance;
      active = true;
      createdAt = now;
      updatedAt = now;
    };
    state.cashRegisters.add(id, register);
    register;
  };

  public func updateCashRegister(state : State, id : Common.Id, input : Types.CashRegisterInput) : Types.CashRegister {
    let existing = state.cashRegisters.get(id) ?? Runtime.trap("Caja o banco no encontrado");
    let name = input.name.trim(#char ' ');
    if (name == "") {
      Runtime.trap("El nombre de la caja o banco es obligatorio");
    };
    let normalized = normalize(name);
    let duplicate = state.cashRegisters.values().any(
      func(register) { register.id != id and normalize(register.name) == normalized }
    );
    if (duplicate) {
      Runtime.trap("Ya existe una caja o banco con ese nombre");
    };
    let updated : Types.CashRegister = {
      existing with
      name;
      kind = input.kind;
      openingBalance = input.openingBalance;
      updatedAt = Time.now();
    };
    state.cashRegisters.add(id, updated);
    updated;
  };

  public func setCashRegisterActive(state : State, id : Common.Id, active : Bool) : Types.CashRegister {
    let existing = state.cashRegisters.get(id) ?? Runtime.trap("Caja o banco no encontrado");
    let updated : Types.CashRegister = { existing with active; updatedAt = Time.now() };
    state.cashRegisters.add(id, updated);
    updated;
  };

  public func deleteCashRegister(state : State, id : Common.Id) : () {
    let _existing = state.cashRegisters.get(id) ?? Runtime.trap("Caja o banco no encontrado");
    let hasOpenShift = state.shifts.values().any(
      func(shift) { shift.registerId == id and sameStatus(shift.status, #open) }
    );
    if (hasOpenShift) {
      Runtime.trap("No se puede eliminar una caja o banco con un turno abierto");
    };
    state.cashRegisters.remove(id);
  };

  public func listCashRegisters(state : State, filter : Types.CashRegisterFilter, offset : Nat, limit : Nat) : Types.CashRegisterPage {
    let search = switch (filter.search) {
      case (?term) { ?normalize(term.trim(#char ' ')) };
      case null { null };
    };
    let matched = state.cashRegisters.values().filter(
      func(register) {
        let kindOk = switch (filter.kind) {
          case (?kind) { sameKind(register.kind, kind) };
          case null { true };
        };
        let activeOk = switch (filter.active) {
          case (?active) { register.active == active };
          case null { true };
        };
        let searchOk = switch (search) {
          case (?term) { term == "" or normalize(register.name).contains(#text term) };
          case null { true };
        };
        kindOk and activeOk and searchOk;
      }
    ).toArray();
    let sorted = matched.sort(
      func(a, b) {
        if (a.name < b.name) { #less } else if (a.name > b.name) { #greater } else {
          if (a.id < b.id) { #less } else if (a.id > b.id) { #greater } else { #equal };
        };
      }
    );
    let total = sorted.size();
    let items = sorted.sliceToArray(offset.toInt(), (offset + limit).toInt());
    { items; total; offset; limit };
  };

  public func getCashRegister(state : State, id : Common.Id) : ?Types.CashRegister {
    state.cashRegisters.get(id);
  };

  // ── Turnos ──────────────────────────────────────────────────────────────

  public func openShift(state : State, input : Types.OpenShiftInput, performedBy : Principal) : Types.Shift {
    let register = state.cashRegisters.get(input.registerId) ?? Runtime.trap("Caja o banco no encontrado");
    if (not register.active) {
      Runtime.trap("La caja o banco está inactiva");
    };
    let alreadyOpen = state.shifts.values().any(
      func(shift) { shift.registerId == input.registerId and sameStatus(shift.status, #open) }
    );
    if (alreadyOpen) {
      Runtime.trap("Ya hay un turno abierto para esta caja o banco");
    };
    let responsibleName = input.responsibleName.trim(#char ' ');
    if (responsibleName == "") {
      Runtime.trap("El responsable del turno es obligatorio");
    };
    let id = state.counters.nextShiftId;
    state.counters.nextShiftId := id + 1;
    let shift : Types.Shift = {
      id;
      registerId = input.registerId;
      responsibleName;
      responsibleUserId = input.responsibleUserId;
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

  // Resuelve el turno abierto de la cuenta indicada (la caja abierta para
  // `#cash`, el banco abierto para `#bank`). Si hay varios del mismo tipo,
  // elige el de mayor id. Devuelve `null` si no hay ninguno.
  public func openShiftForAccount(state : State, account : Types.CashAccount) : ?Types.Shift {
    var target : ?Types.Shift = null;
    for (candidate in state.shifts.values()) {
      if (sameStatus(candidate.status, #open)) {
        let matches = switch (state.cashRegisters.get(candidate.registerId)) {
          case (?register) {
            switch (account) {
              case (#cash) { sameKind(register.kind, #cash) };
              case (#bank) { sameKind(register.kind, #bank) };
            };
          };
          case null { false };
        };
        if (matches) {
          switch (target) {
            case (?current) { if (candidate.id > current.id) { target := ?candidate } };
            case null { target := ?candidate };
          };
        };
      };
    };
    target;
  };

  // Resuelve el turno abierto de la cuenta indicada (la caja abierta para
  // `#cash`, el banco abierto para `#bank`). Si no hay ninguno, abre
  // automáticamente un turno en el primer registro activo de ese tipo, con
  // saldos iniciales en cero y el responsable indicado. Así un movimiento
  // derivado (anticipo o abono de una OT) siempre queda atribuido a un turno
  // sin exigir al usuario abrirlo a mano. Falla si no existe un registro
  // activo del tipo requerido.
  public func resolveOrOpenShiftForAccount(state : State, account : Types.CashAccount, performedBy : Principal, responsibleName : Text) : Types.Shift {
    switch (openShiftForAccount(state, account)) {
      case (?shift) { shift };
      case null {
        var target : ?Types.CashRegister = null;
        for (register in state.cashRegisters.values()) {
          let matches = switch (account) {
            case (#cash) { sameKind(register.kind, #cash) };
            case (#bank) { sameKind(register.kind, #bank) };
          };
          if (register.active and matches) {
            switch (target) {
              case (?current) { if (register.id < current.id) { target := ?register } };
              case null { target := ?register };
            };
          };
        };
        let register = target ?? Runtime.trap("No hay una caja o banco activa para registrar el movimiento");
        openShift(
          state,
          {
            registerId = register.id;
            responsibleName;
            responsibleUserId = null;
            openingCash = 0;
            openingBank = 0;
            notes = ?"Turno abierto automáticamente al registrar un movimiento";
          },
          performedBy,
        );
      };
    };
  };

  public func closeShift(state : State, id : Common.Id, input : Types.CloseShiftInput, performedBy : Principal) : Types.Shift {
    let existing = state.shifts.get(id) ?? Runtime.trap("Turno no encontrado");
    if (not sameStatus(existing.status, #open)) {
      Runtime.trap("El turno ya está cerrado");
    };
    let totals = shiftTotals(state, id);
    let computedCash = existing.openingCash + totals.cashIncome;
    let computedCashFinal = if (computedCash >= totals.cashExpense) { computedCash - totals.cashExpense } else { 0 };
    let computedBank = existing.openingBank + totals.bankIncome;
    let computedBankFinal = if (computedBank >= totals.bankExpense) { computedBank - totals.bankExpense } else { 0 };
    let differenceCash = input.declaredClosingCash.toInt() - computedCashFinal.toInt();
    let differenceBank = input.declaredClosingBank.toInt() - computedBankFinal.toInt();
    let updated : Types.Shift = {
      existing with
      closedAt = ?Time.now();
      declaredClosingCash = ?input.declaredClosingCash;
      declaredClosingBank = ?input.declaredClosingBank;
      computedClosingCash = computedCashFinal;
      computedClosingBank = computedBankFinal;
      differenceCash;
      differenceBank;
      status = #closed;
      closedBy = ?performedBy;
      notes = switch (input.notes) {
        case (?note) { ?note };
        case null { existing.notes };
      };
    };
    state.shifts.add(id, updated);
    updated;
  };

  public func setShiftResponsible(state : State, id : Common.Id, responsibleName : Text, responsibleUserId : ?Common.Id) : Types.Shift {
    let existing = state.shifts.get(id) ?? Runtime.trap("Turno no encontrado");
    if (not sameStatus(existing.status, #open)) {
      Runtime.trap("Solo se puede cambiar el responsable de un turno abierto");
    };
    let name = responsibleName.trim(#char ' ');
    if (name == "") {
      Runtime.trap("El responsable del turno es obligatorio");
    };
    let updated : Types.Shift = { existing with responsibleName = name; responsibleUserId };
    state.shifts.add(id, updated);
    updated;
  };

  public func listShifts(state : State, filter : Types.ShiftFilter, offset : Nat, limit : Nat) : Types.ShiftPage {
    let responsible = switch (filter.responsible) {
      case (?term) { ?normalize(term.trim(#char ' ')) };
      case null { null };
    };
    let matched = state.shifts.values().filter(
      func(shift) {
        let registerOk = switch (filter.registerId) {
          case (?registerId) { shift.registerId == registerId };
          case null { true };
        };
        let responsibleOk = switch (responsible) {
          case (?term) { term == "" or normalize(shift.responsibleName).contains(#text term) };
          case null { true };
        };
        let statusOk = switch (filter.status) {
          case (?status) { sameStatus(shift.status, status) };
          case null { true };
        };
        let fromOk = switch (filter.from) {
          case (?from) { shift.openedAt >= from };
          case null { true };
        };
        let toOk = switch (filter.to) {
          case (?to) { shift.openedAt <= to };
          case null { true };
        };
        registerOk and responsibleOk and statusOk and fromOk and toOk;
      }
    ).toArray();
    let sorted = matched.sort(
      func(a, b) {
        if (a.openedAt > b.openedAt) { #less } else if (a.openedAt < b.openedAt) { #greater } else {
          if (a.id > b.id) { #less } else if (a.id < b.id) { #greater } else { #equal };
        };
      }
    );
    let total = sorted.size();
    let items = sorted.sliceToArray(offset.toInt(), (offset + limit).toInt());
    { items; total; offset; limit };
  };

  // Devuelve un turno por id, con sus saldos calculados derivados en vivo de
  // los movimientos cuando el turno sigue abierto.
  public func getShift(state : State, id : Common.Id) : ?Types.Shift {
    switch (state.shifts.get(id)) {
      case (?shift) { ?withLiveBalances(state, shift) };
      case null { null };
    };
  };

  // Saldos calculados en vivo de un turno: saldo inicial más los ingresos y
  // menos los egresos registrados hasta el momento, por cuenta. Se usa para
  // que los turnos abiertos reflejen los movimientos (anticipos, ventas POS,
  // cobros, abonos) sin esperar al cierre. Para un turno cerrado los saldos
  // almacenados ya son definitivos y se devuelven tal cual.
  func liveComputedBalances(state : State, shift : Types.Shift) : (Common.Money, Common.Money) {
    if (not sameStatus(shift.status, #open)) {
      return (shift.computedClosingCash, shift.computedClosingBank);
    };
    let totals = shiftTotals(state, shift.id);
    let cash = shift.openingCash + totals.cashIncome;
    let cashFinal = if (cash >= totals.cashExpense) { cash - totals.cashExpense } else { 0 };
    let bank = shift.openingBank + totals.bankIncome;
    let bankFinal = if (bank >= totals.bankExpense) { bank - totals.bankExpense } else { 0 };
    (cashFinal, bankFinal);
  };

  // Devuelve el turno con sus saldos calculados actualizados a partir de los
  // movimientos registrados. No altera el estado almacenado.
  public func withLiveBalances(state : State, shift : Types.Shift) : Types.Shift {
    let (cash, bank) = liveComputedBalances(state, shift);
    { shift with computedClosingCash = cash; computedClosingBank = bank };
  };

  // Devuelve el turno abierto de una caja/banco, o null si no tiene ninguno.
  // Los saldos calculados se derivan en vivo de los movimientos.
  public func getOpenShift(state : State, registerId : Common.Id) : ?Types.Shift {
    var found : ?Types.Shift = null;
    for (shift in state.shifts.values()) {
      if (shift.registerId == registerId and sameStatus(shift.status, #open)) {
        switch (found) {
          case (?current) { if (shift.id > current.id) { found := ?shift } };
          case null { found := ?shift };
        };
      };
    };
    switch (found) {
      case (?shift) { ?withLiveBalances(state, shift) };
      case null { null };
    };
  };

  // Devuelve todos los turnos abiertos, uno por caja/banco como máximo, con
  // sus saldos calculados derivados en vivo de los movimientos.
  public func listOpenShifts(state : State) : [Types.Shift] {
    state.shifts.values().filter(
      func(shift) { sameStatus(shift.status, #open) }
    ).toArray().sort(
      func(a, b) {
        if (a.registerId < b.registerId) { #less } else if (a.registerId > b.registerId) { #greater } else {
          if (a.id < b.id) { #less } else if (a.id > b.id) { #greater } else { #equal };
        };
      }
    ).map(func(shift) { withLiveBalances(state, shift) });
  };

  // ── Movimientos ─────────────────────────────────────────────────────────

  public func registerCashMovement(state : State, input : Types.CashMovementInput, performedBy : Principal) : Types.CashMovement {
    ignore performedBy;
    if (input.amount == 0) {
      Runtime.trap("El valor del movimiento debe ser mayor que cero");
    };
    // El movimiento se liga al turno abierto de la caja/banco elegida. Si
    // `input.shiftId` viene con valor, ese turno es el destino (debe existir,
    // estar abierto y su caja/banco debe corresponder a la cuenta derivada del
    // medio de pago). Si es null, el registro se resuelve por la cuenta
    // afectada: los movimientos de caja van a la caja abierta y los de banco al
    // banco abierto.
    let account = accountFor(input.paymentMethod, input.account);
    let shift = switch (input.shiftId) {
      case (?shiftId) {
        let selected = state.shifts.get(shiftId) ?? Runtime.trap("Turno no encontrado");
        if (not sameStatus(selected.status, #open)) {
          Runtime.trap("El turno seleccionado no está abierto");
        };
        let register = state.cashRegisters.get(selected.registerId);
        let matches = switch (register) {
          case (?r) {
            switch (account) {
              case (#cash) { sameKind(r.kind, #cash) };
              case (#bank) { sameKind(r.kind, #bank) };
            };
          };
          case null { false };
        };
        if (not matches) {
          Runtime.trap("El turno no corresponde a la cuenta del medio de pago");
        };
        selected;
      };
      case null {
        var target : ?Types.Shift = null;
        for (candidate in state.shifts.values()) {
          if (sameStatus(candidate.status, #open)) {
            let register = state.cashRegisters.get(candidate.registerId);
            let matches = switch (register) {
              case (?r) {
                switch (account) {
                  case (#cash) { sameKind(r.kind, #cash) };
                  case (#bank) { sameKind(r.kind, #bank) };
                };
              };
              case null { false };
            };
            if (matches) {
              switch (target) {
                case (?current) { if (candidate.id > current.id) { target := ?candidate } };
                case null { target := ?candidate };
              };
            };
          };
        };
        target ?? Runtime.trap("No hay un turno abierto para esta caja o banco");
      };
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
      account;
      description = input.description;
      reference = input.reference;
      source = input.source;
    };
    state.cashMovements.add(id, movement);
    movement;
  };

  public func listCashMovements(state : State, filter : Types.CashMovementFilter, offset : Nat, limit : Nat) : Types.CashMovementPage {
    let matched = state.cashMovements.values().filter(
      func(movement) {
        let shiftOk = switch (filter.shiftId) {
          case (?shiftId) { movement.shiftId == shiftId };
          case null { true };
        };
        let registerOk = switch (filter.registerId) {
          case (?registerId) {
            switch (state.shifts.get(movement.shiftId)) {
              case (?shift) { shift.registerId == registerId };
              case null { false };
            };
          };
          case null { true };
        };
        let kindOk = switch (filter.kind) {
          case (?kind) { sameMovementKind(movement.kind, kind) };
          case null { true };
        };
        let accountOk = switch (filter.account) {
          case (?account) { sameAccount(movement.account, account) };
          case null { true };
        };
        let methodOk = switch (filter.paymentMethod) {
          case (?method) { samePaymentMethod(movement.paymentMethod, method) };
          case null { true };
        };
        let fromOk = switch (filter.from) {
          case (?from) { movement.timestamp >= from };
          case null { true };
        };
        let toOk = switch (filter.to) {
          case (?to) { movement.timestamp <= to };
          case null { true };
        };
        shiftOk and registerOk and kindOk and accountOk and methodOk and fromOk and toOk;
      }
    ).toArray();
    let sorted = matched.sort(
      func(a, b) {
        if (a.timestamp > b.timestamp) { #less } else if (a.timestamp < b.timestamp) { #greater } else {
          if (a.id > b.id) { #less } else if (a.id < b.id) { #greater } else { #equal };
        };
      }
    );
    let total = sorted.size();
    let items = sorted.sliceToArray(offset.toInt(), (offset + limit).toInt());
    { items; total; offset; limit };
  };

  // Totales internos de un turno por cuenta.
  type ShiftTotals = {
    cashIncome : Common.Money;
    cashExpense : Common.Money;
    bankIncome : Common.Money;
    bankExpense : Common.Money;
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

  public func getDailyShiftReport(state : State, shiftId : Common.Id) : Types.DailyShiftReport {
    let shift = state.shifts.get(shiftId) ?? Runtime.trap("Turno no encontrado");
    let liveShift = withLiveBalances(state, shift);
    let registerName = switch (state.cashRegisters.get(shift.registerId)) {
      case (?register) { register.name };
      case null { "" };
    };
    let movements = state.cashMovements.values().filter(
      func(movement) { movement.shiftId == shiftId }
    ).toArray().sort(
      func(a, b) {
        if (a.timestamp < b.timestamp) { #less } else if (a.timestamp > b.timestamp) { #greater } else {
          if (a.id < b.id) { #less } else if (a.id > b.id) { #greater } else { #equal };
        };
      }
    );
    var totalIncome = 0;
    var totalExpense = 0;
    var cashIncome = 0;
    var cashExpense = 0;
    var bankIncome = 0;
    var bankExpense = 0;
    // Totales por medio de pago, en el orden fijo de la variante.
    let methods : [Billing.PaymentMethod] = [#cash, #card, #transfer, #mixed];
    var byPaymentMethod : [Types.PaymentMethodTotal] = [];
    for (method in methods.values()) {
      var income = 0;
      var expense = 0;
      for (movement in movements.values()) {
        if (samePaymentMethod(movement.paymentMethod, method)) {
          switch (movement.kind) {
            case (#income) { income += movement.amount };
            case (#expense) { expense += movement.amount };
          };
        };
      };
      byPaymentMethod := byPaymentMethod.concat([{ method; income; expense }]);
    };
    for (movement in movements.values()) {
      switch (movement.kind) {
        case (#income) { totalIncome += movement.amount };
        case (#expense) { totalExpense += movement.amount };
      };
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
    {
      shift = liveShift;
      registerName;
      responsibleName = shift.responsibleName;
      movements;
      byPaymentMethod;
      totalIncome;
      totalExpense;
      cashIncome;
      cashExpense;
      bankIncome;
      bankExpense;
    };
  };
};
