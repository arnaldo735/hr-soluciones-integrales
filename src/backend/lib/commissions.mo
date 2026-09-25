import Int "mo:core/Int";
import List "mo:core/List";
import Map "mo:core/Map";
import Runtime "mo:core/Runtime";
import Set "mo:core/Set";
import Text "mo:core/Text";
import Time "mo:core/Time";

import Common "../types/common";
import Types "../types/commissions";
import CommissionLineKey "../types/commission-line-key";
import CustomerTypes "../types/customers";
import ServiceTypes "../types/services";
import TechnicianTypes "../types/technicians";
import WorkshopTypes "../types/workshop";

module {
  public type Counters = {
    var nextTechnicianLoanId : Nat;
    var nextCommissionPaymentId : Nat;
  };

  public type State = {
    loans : Map.Map<Common.Id, Types.TechnicianLoan>;
    commissionPayments : Map.Map<Common.Id, Types.CommissionPayment>;
    paidCommissionLines : Set.Set<CommissionLineKey.CommissionLineKey>;
    technicians : Map.Map<Common.Id, TechnicianTypes.Technician>;
    orders : Map.Map<Common.Id, WorkshopTypes.WorkshopOrder>;
    motorcycles : Map.Map<Common.Id, CustomerTypes.Motorcycle>;
    services : Map.Map<Common.Id, ServiceTypes.Service>;
    counters : Counters;
  };

  // --- helpers -------------------------------------------------------------

  func inPeriod(at : Common.Timestamp, period : Types.CommissionPeriod) : Bool {
    let afterFrom = switch (period.from) {
      case null { true };
      case (?from) { at >= from };
    };
    let beforeTo = switch (period.to) {
      case null { true };
      case (?to) { at <= to };
    };
    afterFrom and beforeTo;
  };

  func lineKey(orderId : Common.Id, laborId : Common.Id) : CommissionLineKey.CommissionLineKey {
    { orderId; laborId };
  };

  // Los servicios de la categoría "Servicio de terceros" no generan comisión:
  // el trabajo se subcontrata y no se comisiona al técnico.
  let thirdPartyCategory : Text = "Servicio de terceros";

  func isThirdParty(service : ServiceTypes.Service) : Bool {
    service.category.trim(#predicate (func (c : Char) : Bool = c == ' ')).toLower() == thirdPartyCategory.toLower();
  };

  // Deriva las líneas de comisión de las órdenes de taller: solo la mano de
  // obra vinculada a un servicio del catálogo y con técnico responsable genera
  // comisión. Las líneas libres y los repuestos nunca. Solo las órdenes
  // entregadas generan comisión: una orden en proceso, lista o cancelada no
  // comisiona. Los servicios de categoría "Servicio de terceros" tampoco.
  func deriveLines(state : State, technicianId : ?Common.Id, period : Types.CommissionPeriod) : [Types.CommissionLine] {
    let out = List.empty<Types.CommissionLine>();
    for (order in state.orders.values()) {
      if (order.status != #delivered) { continue };
      for (item in order.labor.values()) {
        switch (item.serviceId) {
          case null {};
          case (?serviceId) {
            // La línea solo genera comisión si el servicio existe en el
            // catálogo; una referencia colgante no comisiona.
            switch (state.services.get(serviceId)) {
              case null {};
              case (?service) {
                if (isThirdParty(service)) { continue };
                switch (item.technicianId) {
                  case null {};
                  case (?assignedId) {
                    let technicianOk = switch (technicianId) {
                      case null { true };
                      case (?wanted) { assignedId == wanted };
                    };
                    if (technicianOk and inPeriod(order.updatedAt, period)) {
                      switch (state.technicians.get(assignedId)) {
                        case null {};
                        case (?technician) {
                          let motorcycle = state.motorcycles.get(order.motorcycleId);
                          let commissionAmount = item.price * technician.commissionRate / 100;
                          out.add({
                            orderId = order.id;
                            orderNumber = order.orderNumber;
                            laborId = item.id;
                            description = item.description;
                            serviceId;
                            serviceName = service.name;
                            motorcycleBrand = switch (motorcycle) {
                              case (?m) { m.brand };
                              case null { "" };
                            };
                            motorcycleModel = switch (motorcycle) {
                              case (?m) { m.model };
                              case null { "" };
                            };
                            motorcyclePlate = switch (motorcycle) {
                              case (?m) { m.plate };
                              case null { "" };
                            };
                            serviceDate = order.updatedAt;
                            technicianId = assignedId;
                            technicianCode = technician.code;
                            technicianName = technician.name;
                            baseAmount = item.price;
                            commissionRate = technician.commissionRate;
                            commissionAmount;
                            at = order.updatedAt;
                          });
                        };
                      };
                    };
                  };
                };
              };
            };
          };
        };
      };
    };
    out.toArray().sort(func (a, b) = Int.compare(a.at, b.at));
  };

  func pendingLines(state : State, technicianId : Common.Id, period : Types.CommissionPeriod) : [Types.CommissionLine] {
    deriveLines(state, ?technicianId, period).filter(
      func (line) = not state.paidCommissionLines.contains(lineKey(line.orderId, line.laborId))
    );
  };

  func pendingLoans(state : State, technicianId : Common.Id) : [Types.TechnicianLoan] {
    let out = List.empty<Types.TechnicianLoan>();
    for (loan in state.loans.values()) {
      if (loan.technicianId == technicianId and not loan.deducted) {
        out.add(loan);
      };
    };
    out.toArray().sort(func (a, b) = Int.compare(a.date, b.date));
  };

  func sumAmounts(lines : [Types.CommissionLine]) : Common.Money {
    lines.foldLeft(0, func (acc, line) = acc + line.commissionAmount);
  };

  func sumBase(lines : [Types.CommissionLine]) : Common.Money {
    lines.foldLeft(0, func (acc, line) = acc + line.baseAmount);
  };

  func sumLoans(loans : [Types.TechnicianLoan]) : Common.Money {
    loans.foldLeft(0, func (acc, loan) = acc + loan.amount);
  };

  // El neto nunca es negativo: si los préstamos superan la comisión, el neto
  // a pagar es 0 (el préstamo se descuenta completo igualmente).
  func netOf(commissionAmount : Common.Money, loansAmount : Common.Money) : Common.Money {
    if (loansAmount >= commissionAmount) { 0 } else { commissionAmount - loansAmount };
  };

  func findTechnician(state : State, id : Common.Id) : TechnicianTypes.Technician {
    state.technicians.get(id) ?? Runtime.trap("Técnico no encontrado");
  };

  // --- Préstamos -----------------------------------------------------------

  public func listLoans(state : State, filter : Types.TechnicianLoanFilter) : [Types.TechnicianLoan] {
    let out = List.empty<Types.TechnicianLoan>();
    for (loan in state.loans.values()) {
      let technicianOk = switch (filter.technicianId) {
        case null { true };
        case (?id) { loan.technicianId == id };
      };
      let pendingOk = switch (filter.pendingOnly) {
        case null { true };
        case (?only) { if (only) { not loan.deducted } else { true } };
      };
      if (technicianOk and pendingOk) { out.add(loan) };
    };
    out.toArray().sort(func (a, b) = Int.compare(b.date, a.date));
  };

  public func getLoan(state : State, id : Types.Id) : ?Types.TechnicianLoan {
    state.loans.get(id);
  };

  public func createLoan(state : State, input : Types.TechnicianLoanInput) : Types.TechnicianLoan {
    if (input.amount == 0) {
      Runtime.trap("El monto del préstamo debe ser mayor que cero");
    };
    ignore findTechnician(state, input.technicianId);
    let id = state.counters.nextTechnicianLoanId;
    state.counters.nextTechnicianLoanId := id + 1;
    let loan : Types.TechnicianLoan = {
      id;
      technicianId = input.technicianId;
      amount = input.amount;
      date = input.date;
      note = input.note;
      deducted = false;
      deductedAt = null;
      commissionPaymentId = null;
      createdAt = Time.now();
    };
    state.loans.add(id, loan);
    loan;
  };

  public func deleteLoan(state : State, id : Types.Id) : Bool {
    switch (state.loans.get(id)) {
      case null { false };
      case (?loan) {
        if (loan.deducted) {
          Runtime.trap("No se puede eliminar un préstamo ya deducido");
        };
        state.loans.remove(id);
        true;
      };
    };
  };

  // --- Comisiones ----------------------------------------------------------

  public func listCommissionLines(state : State, technicianId : ?Types.Id, period : Types.CommissionPeriod) : [Types.CommissionLine] {
    deriveLines(state, technicianId, period);
  };

  public func getCommissionReport(state : State, period : Types.CommissionPeriod) : Types.CommissionReport {
    let summaries = List.empty<Types.TechnicianCommissionSummary>();
    for (technician in state.technicians.values()) {
      let lines = pendingLines(state, technician.id, period);
      let loans = pendingLoans(state, technician.id);
      let commissionAmount = sumAmounts(lines);
      let loansAmount = sumLoans(loans);
      if (lines.size() > 0 or loans.size() > 0) {
        summaries.add({
          technicianId = technician.id;
          technicianCode = technician.code;
          technicianName = technician.name;
          commissionRate = technician.commissionRate;
          lineCount = lines.size();
          baseAmount = sumBase(lines);
          commissionAmount;
          pendingLoansAmount = loansAmount;
          pendingLoanCount = loans.size();
          netPayable = netOf(commissionAmount, loansAmount);
        });
      };
    };
    let technicians = summaries.toArray().sort(
      func (a, b) = Text.compare(a.technicianName.toLower(), b.technicianName.toLower())
    );
    {
      period;
      technicians;
      totalBase = technicians.foldLeft(0, func (acc, s) = acc + s.baseAmount);
      totalCommission = technicians.foldLeft(0, func (acc, s) = acc + s.commissionAmount);
      totalPendingLoans = technicians.foldLeft(0, func (acc, s) = acc + s.pendingLoansAmount);
      totalNetPayable = technicians.foldLeft(0, func (acc, s) = acc + s.netPayable);
    };
  };

  public func getTechnicianCommissionSummary(state : State, technicianId : Types.Id, period : Types.CommissionPeriod) : ?Types.TechnicianCommissionSummary {
    switch (state.technicians.get(technicianId)) {
      case null { null };
      case (?technician) {
        let lines = pendingLines(state, technicianId, period);
        let loans = pendingLoans(state, technicianId);
        let commissionAmount = sumAmounts(lines);
        let loansAmount = sumLoans(loans);
        ?{
          technicianId;
          technicianCode = technician.code;
          technicianName = technician.name;
          commissionRate = technician.commissionRate;
          lineCount = lines.size();
          baseAmount = sumBase(lines);
          commissionAmount;
          pendingLoansAmount = loansAmount;
          pendingLoanCount = loans.size();
          netPayable = netOf(commissionAmount, loansAmount);
        };
      };
    };
  };

  // --- Pagos de comisiones -------------------------------------------------

  public func listCommissionPayments(state : State, filter : Types.CommissionPaymentFilter) : [Types.CommissionPayment] {
    let out = List.empty<Types.CommissionPayment>();
    for (payment in state.commissionPayments.values()) {
      let technicianOk = switch (filter.technicianId) {
        case null { true };
        case (?id) { payment.technicianId == id };
      };
      let fromOk = switch (filter.from) {
        case null { true };
        case (?from) { payment.paidAt >= from };
      };
      let toOk = switch (filter.to) {
        case null { true };
        case (?to) { payment.paidAt <= to };
      };
      if (technicianOk and fromOk and toOk) { out.add(payment) };
    };
    out.toArray().sort(func (a, b) = Int.compare(b.paidAt, a.paidAt));
  };

  public func getCommissionPayment(state : State, id : Types.Id) : ?Types.CommissionPayment {
    state.commissionPayments.get(id);
  };

  public func payCommission(state : State, input : Types.CommissionPaymentInput, paidBy : Principal) : Types.CommissionPayment {
    let technician = findTechnician(state, input.technicianId);
    let lines = pendingLines(state, input.technicianId, input.period);
    if (lines.size() == 0) {
      Runtime.trap("No hay comisiones pendientes para pagar");
    };
    let loans = pendingLoans(state, input.technicianId);
    let commissionAmount = sumAmounts(lines);
    let loansAmount = sumLoans(loans);
    let id = state.counters.nextCommissionPaymentId;
    state.counters.nextCommissionPaymentId := id + 1;
    let paidAt = Time.now();

    // Marca cada línea como pagada para no volver a pagarla.
    for (line in lines.values()) {
      state.paidCommissionLines.add(lineKey(line.orderId, line.laborId));
    };

    // El préstamo se descuenta completo, no en abonos parciales.
    let paymentLoans = List.empty<Types.CommissionPaymentLoan>();
    for (loan in loans.values()) {
      state.loans.add(loan.id, {
        loan with
        deducted = true;
        deductedAt = ?paidAt;
        commissionPaymentId = ?id;
      });
      paymentLoans.add({
        loanId = loan.id;
        amount = loan.amount;
        date = loan.date;
        note = loan.note;
      });
    };

    let payment : Types.CommissionPayment = {
      id;
      technicianId = technician.id;
      technicianCode = technician.code;
      technicianName = technician.name;
      period = input.period;
      lineCount = lines.size();
      lines;
      baseAmount = sumBase(lines);
      commissionAmount;
      loans = paymentLoans.toArray();
      loansDeducted = loansAmount;
      netPaid = netOf(commissionAmount, loansAmount);
      paidBy;
      paidAt;
    };
    state.commissionPayments.add(id, payment);
    payment;
  };
};
