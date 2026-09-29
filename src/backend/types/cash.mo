import Common "common";
import Billing "billing";

module {
  public type Id = Common.Id;
  public type Timestamp = Common.Timestamp;
  public type Money = Common.Money;

  // ── Caja y Bancos ───────────────────────────────────────────────────────
  // Módulo de tesorería: turnos de caja y movimientos de ingreso/egreso
  // clasificados por medio de pago. Cada movimiento afecta una cuenta:
  // `#cash` (Caja) o `#bank` (Bancos). Los ingresos por transferencia suman a
  // Bancos; los pagos por transferencia se descuentan de Bancos; los
  // movimientos en efectivo afectan Caja. Unidades monetarias: centavos
  // enteros (Money = Nat). Timestamps en nanosegundos (Int).

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
  //   #other       : cualquier otro origen.
  public type CashMovementSource = {
    #manual;
    #invoice;
    #receivable;
    #purchase;
    #expense;
    #commission;
    #pos;
    #other;
  };

  // Estado de un turno de caja.
  public type ShiftStatus = { #open; #closed };

  // Turno de caja. Al abrir se declaran los saldos iniciales de Caja y
  // Bancos; al cerrar se declaran los saldos finales y el backend calcula la
  // diferencia contra los saldos esperados (inicial + movimientos del turno).
  //
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

  // Entrada para abrir un turno: saldos iniciales declarados.
  public type OpenShiftInput = {
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
  public type CashMovementInput = {
    kind : CashMovementKind;
    paymentMethod : Billing.PaymentMethod;
    amount : Money;
    account : CashAccount;
    description : Text;
    reference : ?Text;
    source : CashMovementSource;
  };

  // Filtro de turnos. `status` filtra por estado; `from` / `to` acotan por
  // `openedAt` (inclusive).
  public type ShiftFilter = {
    status : ?ShiftStatus;
    from : ?Timestamp;
    to : ?Timestamp;
  };

  // Filtro de movimientos. `shiftId` limita a un turno; `kind`, `account` y
  // `paymentMethod` son igualdad exacta; `from` / `to` acotan por `timestamp`
  // (inclusive).
  public type CashMovementFilter = {
    shiftId : ?Id;
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

  // Informe diario de un turno: todos los movimientos del turno, totales por
  // medio de pago y saldos finales (declarados y calculados).
  public type DailyShiftReport = {
    shift : Shift;
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
    #shiftAlreadyOpen;
    #noOpenShift;
    #shiftClosed;
    #invalidAmount;
    #notAuthorized;
  };
};
