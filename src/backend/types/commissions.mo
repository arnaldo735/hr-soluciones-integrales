import Common "common";
import CommissionLineKeyTypes "commission-line-key";

module {
  public type Id = Common.Id;
  public type Timestamp = Common.Timestamp;
  public type Money = Common.Money;

  // ── Préstamos / anticipos a técnicos ────────────────────────────────────

  public type TechnicianLoan = {
    id : Id;
    technicianId : Id;
    amount : Money;
    date : Timestamp;
    note : ?Text;
    deducted : Bool;
    deductedAt : ?Timestamp;
    commissionPaymentId : ?Id;
    createdAt : Timestamp;
  };

  public type TechnicianLoanInput = {
    technicianId : Id;
    amount : Money;
    date : Timestamp;
    note : ?Text;
  };

  public type TechnicianLoanFilter = {
    technicianId : ?Id;
    pendingOnly : ?Bool;
  };

  // ── Comisiones por línea de mano de obra ────────────────────────────────

  // Solo las líneas de mano de obra vinculadas a un servicio del catálogo de
  // taller generan comisión. El desglose incluye el servicio realizado, la
  // moto (marca, modelo y placa) y la fecha del servicio.
  public type CommissionLine = {
    orderId : Id;
    orderNumber : Text;
    laborId : Id;
    description : Text;
    serviceId : Id;
    serviceName : Text;
    motorcycleBrand : Text;
    motorcycleModel : Text;
    motorcyclePlate : Text;
    serviceDate : Timestamp;
    technicianId : Id;
    technicianCode : Text;
    technicianName : Text;
    baseAmount : Money;
    commissionRate : Nat;
    commissionAmount : Money;
    at : Timestamp;
  };

  public type CommissionPeriod = {
    from : ?Timestamp;
    to : ?Timestamp;
  };

  // Clave estable de una línea de mano de obra ya pagada: `orderId` + `laborId`.
  // Se usa para no pagar dos veces la misma línea.
  public type CommissionLineKey = CommissionLineKeyTypes.CommissionLineKey;

  public type TechnicianCommissionSummary = {
    technicianId : Id;
    technicianCode : Text;
    technicianName : Text;
    commissionRate : Nat;
    lineCount : Nat;
    baseAmount : Money;
    commissionAmount : Money;
    pendingLoansAmount : Money;
    pendingLoanCount : Nat;
    netPayable : Money;
  };

  public type CommissionReport = {
    period : CommissionPeriod;
    technicians : [TechnicianCommissionSummary];
    totalBase : Money;
    totalCommission : Money;
    totalPendingLoans : Money;
    totalNetPayable : Money;
  };

  // ── Pagos de comisiones ─────────────────────────────────────────────────

  public type CommissionPaymentLoan = {
    loanId : Id;
    amount : Money;
    date : Timestamp;
    note : ?Text;
  };

  // Comprobante de pago. `lines` conserva el mismo desglose por servicio y
  // moto que el reporte, para que el comprobante lo muestre.
  public type CommissionPayment = {
    id : Id;
    technicianId : Id;
    technicianCode : Text;
    technicianName : Text;
    period : CommissionPeriod;
    lineCount : Nat;
    lines : [CommissionLine];
    baseAmount : Money;
    commissionAmount : Money;
    loans : [CommissionPaymentLoan];
    loansDeducted : Money;
    netPaid : Money;
    paidBy : Principal;
    paidAt : Timestamp;
  };

  public type CommissionPaymentInput = {
    technicianId : Id;
    period : CommissionPeriod;
  };

  public type CommissionPaymentFilter = {
    technicianId : ?Id;
    from : ?Timestamp;
    to : ?Timestamp;
  };

  public type CommissionError = {
    #notFound : Id;
    #technicianNotFound : Id;
    #nothingToPay;
    #invalidAmount;
    #notAuthorized;
  };
};
