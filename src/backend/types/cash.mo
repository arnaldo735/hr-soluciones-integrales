import Common "common";
import Billing "billing";

module {
  public type Id = Common.Id;
  public type Timestamp = Common.Timestamp;
  public type Money = Common.Money;

  // ── Caja y Bancos ───────────────────────────────────────────────────────
  // Módulo de tesorería: catálogo de cajas y bancos, turnos independientes por
  // registro y movimientos de ingreso/egreso clasificados por medio de pago.
  // Cada movimiento afecta una cuenta: `#cash` (Caja) o `#bank` (Bancos). Los
  // ingresos por transferencia suman a Bancos; los pagos por transferencia se
  // descuentan de Bancos; los movimientos en efectivo afectan Caja. Unidades
  // monetarias: centavos enteros (Money = Nat). Timestamps en nanosegundos
  // (Int).

  // Cuenta afectada por un movimiento de tesorería.
  public type CashAccount = { #cash; #bank };

  // Naturaleza del movimiento: ingreso (suma) o egreso (resta).
  public type CashMovementKind = { #income; #expense };

  // Origen del movimiento, para trazabilidad en el informe diario.
  //   #manual      : registrado a mano desde el modal de Caja y Bancos.
  //   #invoice     : cobro de una factura.
  //   #receivable  : abono de una cuenta por cobrar.
  //   #purchase    : pago a proveedor.
  //   #expense     : gasto operativo.
  //   #commission  : pago de comisión a un técnico.
  //   #pos         : venta de mostrador.
  //   #advance     : anticipo de una orden de taller (efectivo o
  //                  transferencia), distinto del cobro de una factura.
  //   #other       : cualquier otro origen.
  public type CashMovementSource = {
    #manual;
    #invoice;
    #receivable;
    #purchase;
    #expense;
    #commission;
    #pos;
    #advance;
    #other;
  };

  // Estado de un turno de caja.
  public type ShiftStatus = { #open; #closed };

  // ── Catálogo de cajas y bancos ──────────────────────────────────────────

  // Tipo de registro de tesorería: caja de efectivo o cuenta bancaria.
  public type CashRegisterKind = { #cash; #bank };

  // Registro de tesorería (caja o banco). Cada registro puede tener como
  // máximo un turno abierto a la vez, y conserva su historial de turnos y
  // movimientos aunque se desactive.
  //
  //   id             : identificador del registro.
  //   name           : nombre visible (único, sin distinguir mayúsculas ni
  //                    tildes).
  //   kind           : #cash (Caja) o #bank (Banco).
  //   openingBalance : saldo inicial declarado del registro, en centavos.
  //   active         : si está activo; los inactivos no permiten abrir turnos
  //                    nuevos pero conservan su historial.
  //   createdAt      : fecha de creación.
  //   updatedAt      : fecha de la última edición.
  public type CashRegister = {
    id : Id;
    name : Text;
    kind : CashRegisterKind;
    openingBalance : Money;
    active : Bool;
    createdAt : Timestamp;
    updatedAt : Timestamp;
  };

  // Entrada para crear un registro de tesorería.
  public type CashRegisterInput = {
    name : Text;
    kind : CashRegisterKind;
    openingBalance : Money;
  };

  // Filtro del catálogo de cajas y bancos. `kind` filtra por tipo; `active`
  // filtra por estado activo/inactivo; `search` busca por nombre (ignorando
  // mayúsculas y tildes).
  public type CashRegisterFilter = {
    kind : ?CashRegisterKind;
    active : ?Bool;
    search : ?Text;
  };

  public type CashRegisterPage = {
    items : [CashRegister];
    total : Nat;
    offset : Nat;
    limit : Nat;
  };

  // ── Turnos ──────────────────────────────────────────────────────────────

  // Turno de caja o banco. Al abrir se declara el saldo inicial de la cuenta
  // correspondiente al tipo del registro; al cerrar se declara el saldo final
  // y el backend calcula la diferencia contra el saldo esperado (inicial +
  // movimientos del turno).
  //
  //   registerId           : caja o banco al que pertenece el turno.
  //   responsibleName      : nombre del responsable del turno (usuario del
  //                          sistema o nombre libre).
  //   responsibleUserId    : id del usuario responsable cuando se eligió un
  //                          usuario del sistema; null si es un nombre libre.
  //   openingCash          : saldo inicial declarado de Caja.
  //   openingBank          : saldo inicial declarado de Bancos.
  //   declaredClosingCash  : saldo final declarado de Caja (null mientras el
  //                          turno está abierto).
  //   declaredClosingBank  : saldo final declarado de Bancos (null mientras el
  //                          turno está abierto).
  //   computedClosingCash  : saldo final calculado de Caja =
  //                          openingCash + ingresos efectivo − egresos efectivo.
  //   computedClosingBank  : saldo final calculado de Bancos =
  //                          openingBank + ingresos banco − egresos banco.
  //   differenceCash       : declaredClosingCash − computedClosingCash (Int,
  //                          puede ser negativo). 0 mientras el turno está
  //                          abierto.
  //   differenceBank       : declaredClosingBank − computedClosingBank (Int).
  //   status               : #open mientras el turno está en curso; #closed
  //                          tras cerrarlo.
  //   openedBy / closedBy  : principal que abrió / cerró el turno.
  //   notes                : nota libre de apertura o cierre.
  public type Shift = {
    id : Id;
    registerId : Id;
    responsibleName : Text;
    responsibleUserId : ?Id;
    openedAt : Timestamp;
    closedAt : ?Timestamp;
    openingCash : Money;
    openingBank : Money;
    declaredClosingCash : ?Money;
    declaredClosingBank : ?Money;
    computedClosingCash : Money;
    computedClosingBank : Money;
    differenceCash : Int;
    differenceBank : Int;
    status : ShiftStatus;
    openedBy : Principal;
    closedBy : ?Principal;
    notes : ?Text;
  };

  // Movimiento de tesorería dentro de un turno.
  //   shiftId       : turno al que pertenece el movimiento.
  //   kind          : #income (suma) o #expense (resta).
  //   paymentMethod : medio de pago, reutiliza la variante de facturación
  //                   (#cash / #card / #transfer / #mixed).
  //   amount        : valor del movimiento en centavos enteros.
  //   account       : cuenta afectada (#cash o #bank).
  //   description   : descripción legible del movimiento.
  //   reference     : referencia externa opcional (número de factura, etc.).
  //   source        : origen del movimiento.
  public type CashMovement = {
    id : Id;
    shiftId : Id;
    timestamp : Timestamp;
    kind : CashMovementKind;
    paymentMethod : Billing.PaymentMethod;
    amount : Money;
    account : CashAccount;
    description : Text;
    reference : ?Text;
    source : CashMovementSource;
  };

  // Entrada para abrir un turno: registro elegido, responsable y saldo
  // inicial declarado. El saldo inicial se declara en la cuenta que
  // corresponda al tipo del registro (`openingCash` para Caja, `openingBank`
  // para Banco); el otro campo se ignora.
  public type OpenShiftInput = {
    registerId : Id;
    responsibleName : Text;
    responsibleUserId : ?Id;
    openingCash : Money;
    openingBank : Money;
    notes : ?Text;
  };

  // Entrada para cerrar un turno: saldos finales declarados.
  public type CloseShiftInput = {
    declaredClosingCash : Money;
    declaredClosingBank : Money;
    notes : ?Text;
  };

  // Entrada para registrar un movimiento de tesorería.
  //   shiftId : turno destino opcional. Cuando viene con valor, el movimiento
  //             se liga a ese turno abierto (debe existir, estar abierto y su
  //             caja/banco debe corresponder a la cuenta derivada del medio de
  //             pago). Cuando es null, el turno se resuelve por la cuenta
  //             afectada (comportamiento anterior).
  public type CashMovementInput = {
    kind : CashMovementKind;
    paymentMethod : Billing.PaymentMethod;
    amount : Money;
    account : CashAccount;
    description : Text;
    reference : ?Text;
    source : CashMovementSource;
    shiftId : ?Id;
  };

  // Filtro de turnos. `registerId` limita a una caja/banco; `responsible`
  // busca por nombre de responsable (ignorando mayúsculas y tildes);
  // `status` filtra por estado; `from` / `to` acotan por `openedAt`
  // (inclusive).
  public type ShiftFilter = {
    registerId : ?Id;
    responsible : ?Text;
    status : ?ShiftStatus;
    from : ?Timestamp;
    to : ?Timestamp;
  };

  // Filtro de movimientos. `shiftId` limita a un turno; `registerId` limita a
  // los movimientos de los turnos de una caja/banco; `kind`, `account` y
  // `paymentMethod` son igualdad exacta; `from` / `to` acotan por `timestamp`
  // (inclusive).
  public type CashMovementFilter = {
    shiftId : ?Id;
    registerId : ?Id;
    kind : ?CashMovementKind;
    account : ?CashAccount;
    paymentMethod : ?Billing.PaymentMethod;
    from : ?Timestamp;
    to : ?Timestamp;
  };

  public type ShiftPage = {
    items : [Shift];
    total : Nat;
    offset : Nat;
    limit : Nat;
  };

  public type CashMovementPage = {
    items : [CashMovement];
    total : Nat;
    offset : Nat;
    limit : Nat;
  };

  // Totales por medio de pago dentro de un turno.
  public type PaymentMethodTotal = {
    method : Billing.PaymentMethod;
    income : Money;
    expense : Money;
  };

  // Informe diario de un turno: nombre de la caja/banco y responsable, todos
  // los movimientos del turno, totales por medio de pago y saldos finales
  // (declarados y calculados).
  public type DailyShiftReport = {
    shift : Shift;
    registerName : Text;
    responsibleName : Text;
    movements : [CashMovement];
    byPaymentMethod : [PaymentMethodTotal];
    totalIncome : Money;
    totalExpense : Money;
    cashIncome : Money;
    cashExpense : Money;
    bankIncome : Money;
    bankExpense : Money;
  };

  public type CashError = {
    #notFound : Id;
    #registerNotFound : Id;
    #duplicateRegisterName : Text;
    #registerInactive : Id;
    #registerHasOpenShift : Id;
    #shiftAlreadyOpen : Id;
    #noOpenShift;
    #shiftClosed;
    #invalidAmount;
    #notAuthorized;
  };
};
