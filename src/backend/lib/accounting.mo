import List "mo:core/List";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Text "mo:core/Text";

import Common "../types/common";
import Types "../types/accounting";
import BillingTypes "../types/billing";
import ExpenseTypes "../types/expenses";
import InventoryTypes "../types/inventory";
import ServiceTypes "../types/services";
import TechnicianTypes "../types/technicians";
import WorkshopTypes "../types/workshop";

module {
  // Estado contable. Además de facturas, gastos y repuestos, el cálculo de la
  // utilidad por servicio necesita las órdenes de taller (para vincular cada
  // línea de servicio de la factura con su línea de mano de obra), los
  // técnicos (para su `commissionRate`) y el catálogo de servicios (para
  // excluir la categoría "Servicio de terceros", que no genera comisión).
  public type State = {
    invoices : Map.Map<Common.Id, BillingTypes.Invoice>;
    expenses : Map.Map<Common.Id, ExpenseTypes.Expense>;
    parts : Map.Map<Common.Id, InventoryTypes.Part>;
    lots : Map.Map<Common.Id, InventoryTypes.Lot>;
    orders : Map.Map<Common.Id, WorkshopTypes.WorkshopOrder>;
    technicians : Map.Map<Common.Id, TechnicianTypes.Technician>;
    services : Map.Map<Common.Id, ServiceTypes.Service>;
  };

  // --- helpers -------------------------------------------------------------

  func inPeriod(at : Common.Timestamp, period : Types.AccountingPeriod) : Bool {
    let fromOk = switch (period.from) {
      case null { true };
      case (?from) { at >= from };
    };
    let toOk = switch (period.to) {
      case null { true };
      case (?to) { at <= to };
    };
    fromOk and toOk;
  };

  func paymentMethodText(method : BillingTypes.PaymentMethod) : Text {
    switch (method) {
      case (#cash) { "cash" };
      case (#card) { "card" };
      case (#transfer) { "transfer" };
      case (#mixed) { "mixed" };
    };
  };

  func incomeEntries(state : State, period : Types.AccountingPeriod) : [Types.LedgerEntry] {
    let out = List.empty<Types.LedgerEntry>();
    for (invoice in state.invoices.values()) {
      if (invoice.paymentStatus == #paid and inPeriod(invoice.issuedAt, period)) {
        out.add({
          id = invoice.id;
          kind = #income;
          date = invoice.issuedAt;
          concept = "Factura " # invoice.number # " — " # invoice.customerName;
          category = paymentMethodText(invoice.paymentMethod);
          amount = invoice.total;
          referenceId = ?invoice.id;
          referenceType = ?"invoice";
        });
      };
    };
    out.toArray();
  };

  func expenseEntries(state : State, period : Types.AccountingPeriod) : [Types.LedgerEntry] {
    let out = List.empty<Types.LedgerEntry>();
    for (expense in state.expenses.values()) {
      if (inPeriod(expense.date, period)) {
        out.add({
          id = expense.id;
          kind = #expense;
          date = expense.date;
          concept = expense.concept;
          category = expense.categoryName;
          amount = expense.amount;
          referenceId = ?expense.id;
          referenceType = ?"expense";
        });
      };
    };
    out.toArray();
  };

  func allEntries(state : State, period : Types.AccountingPeriod) : [Types.LedgerEntry] {
    incomeEntries(state, period).concat(expenseEntries(state, period)).concat(commissionEntries(state, period));
  };

  // Asientos de comisión de técnicos del periodo. Se agrupan por factura: una
  // entrada por factura pagada cuya comisión total sea mayor que cero, con el
  // importe agregado de sus líneas de servicio. La comisión se muestra como un
  // movimiento propio que reduce la utilidad del libro.
  func commissionEntries(state : State, period : Types.AccountingPeriod) : [Types.LedgerEntry] {
    let breakdown = getProfitBreakdown(state, period);
    let totals = Map.empty<Common.Id, Nat>();
    let order = List.empty<Common.Id>();
    for (line in breakdown.serviceLines.values()) {
      if (line.commission > 0) {
        switch (totals.get(line.invoiceId)) {
          case null {
            totals.add(line.invoiceId, line.commission);
            order.add(line.invoiceId);
          };
          case (?current) { totals.add(line.invoiceId, current + line.commission) };
        };
      };
    };
    let out = List.empty<Types.LedgerEntry>();
    for (invoiceId in order.values()) {
      let amount = totals.get(invoiceId) ?? 0;
      let date = switch (state.invoices.get(invoiceId)) {
        case (?invoice) { invoice.issuedAt };
        case null { 0 };
      };
      out.add({
        id = invoiceId;
        kind = #commission;
        date;
        concept = "Comisión de técnicos";
        category = "commission";
        amount;
        referenceId = ?invoiceId;
        referenceType = ?"commission";
      });
    };
    out.toArray();
  };

  // Los servicios de la categoría "Servicio de terceros" no generan comisión:
  // el trabajo se subcontrata y no se comisiona al técnico. La comparación
  // ignora mayúsculas y espacios externos, igual que en comisiones.
  let thirdPartyCategory : Text = "Servicio de terceros";

  func isThirdParty(service : ServiceTypes.Service) : Bool {
    service.category.trim(#predicate (func (c : Char) : Bool = c == ' ')).toLower() == thirdPartyCategory.toLower();
  };

  // Comisión del técnico por una línea de mano de obra. Es 0 cuando la línea
  // no tiene técnico asignado, cuando el técnico no existe, cuando la línea no
  // está vinculada a un servicio del catálogo, o cuando ese servicio es de
  // categoría "Servicio de terceros". En otro caso es
  // `price × commissionRate / 100`.
  func laborCommission(state : State, item : WorkshopTypes.LaborItem) : Common.Money {
    switch (item.serviceId) {
      case null { 0 };
      case (?serviceId) {
        switch (state.services.get(serviceId)) {
          case null { 0 };
          case (?service) {
            if (isThirdParty(service)) { return 0 };
            switch (item.technicianId) {
              case null { 0 };
              case (?technicianId) {
                switch (state.technicians.get(technicianId)) {
                  case null { 0 };
                  case (?technician) {
                    item.price * technician.commissionRate / 100;
                  };
                };
              };
            };
          };
        };
      };
    };
  };

  // --- public API ----------------------------------------------------------

  public func getSummary(state : State, period : Types.AccountingPeriod) : Types.AccountingSummary {
    var totalIncome = 0;
    var invoiceCount = 0;
    for (invoice in state.invoices.values()) {
      if (invoice.paymentStatus == #paid and inPeriod(invoice.issuedAt, period)) {
        totalIncome += invoice.total;
        invoiceCount += 1;
      };
    };
    var totalExpenses = 0;
    var expenseCount = 0;
    for (expense in state.expenses.values()) {
      if (inPeriod(expense.date, period)) {
        totalExpenses += expense.amount;
        expenseCount += 1;
      };
    };
    let totalCommissions = getProfitBreakdown(state, period).totalCommission;
    let profit = totalIncome.toInt() - totalExpenses.toInt();
    {
      from = period.from;
      to = period.to;
      totalIncome;
      totalExpenses;
      totalCommissions;
      profit;
      netProfit = profit - totalCommissions.toInt();
      invoiceCount;
      expenseCount;
    };
  };

  public func getReport(state : State, period : Types.AccountingPeriod) : Types.AccountingReport {
    let categories = List.empty<Text>();
    let categoryTotals = List.empty<Nat>();
    let methods = List.empty<Text>();
    let methodTotals = List.empty<Nat>();

    for (expense in state.expenses.values()) {
      if (inPeriod(expense.date, period)) {
        let category = expense.categoryName;
        var found = false;
        var i = 0;
        for (existing in categories.values()) {
          if (existing == category) {
            categoryTotals.put(i, categoryTotals.at(i) + expense.amount);
            found := true;
          };
          i += 1;
        };
        if (not found) {
          categories.add(category);
          categoryTotals.add(expense.amount);
        };

        let method = expense.paymentMethod;
        var methodFound = false;
        var j = 0;
        for (existing in methods.values()) {
          if (existing == method) {
            methodTotals.put(j, methodTotals.at(j) + expense.amount);
            methodFound := true;
          };
          j += 1;
        };
        if (not methodFound) {
          methods.add(method);
          methodTotals.add(expense.amount);
        };
      };
    };

    let byExpenseCategory = List.empty<Types.CategoryBreakdown>();
    var i = 0;
    for (category in categories.values()) {
      byExpenseCategory.add({ category; total = categoryTotals.at(i) });
      i += 1;
    };

    let byPaymentMethod = List.empty<Types.PaymentMethodBreakdown>();
    var j = 0;
    for (method in methods.values()) {
      byPaymentMethod.add({ method; total = methodTotals.at(j) });
      j += 1;
    };

    let entries = allEntries(state, period).sort(func (a, b) = Int.compare(b.date, a.date));

    {
      summary = getSummary(state, period);
      byExpenseCategory = byExpenseCategory.toArray().sort(func (a, b) = Text.compare(a.category, b.category));
      byPaymentMethod = byPaymentMethod.toArray().sort(func (a, b) = Text.compare(a.method, b.method));
      entries;
      profit = getProfitBreakdown(state, period);
    };
  };

  // Utilidad de repuestos vs servicios en el periodo. Cada línea de factura
  // pagada aporta su ingreso (amount) al bloque que corresponde a su `kind`.
  // Para repuestos el costo es `unitCost × quantity`. Para servicios el costo
  // es la comisión del técnico por esa línea de mano de obra, de modo que
  // utilidad del servicio = valor cobrado − comisión del técnico.
  //
  // La comisión se obtiene emparejando, en orden de aparición, cada línea de
  // servicio de la factura con las líneas de mano de obra de la orden de
  // taller referenciada por `invoice.orderId`. Las líneas de servicio de
  // categoría "Servicio de terceros" no generan comisión (costo 0, utilidad =
  // valor cobrado). El total consolida ambos bloques.
  public func getProfitBreakdown(state : State, period : Types.AccountingPeriod) : Types.ProfitBreakdown {
    var partsIncome = 0;
    var partsCost = 0;
    var servicesIncome = 0;
    var servicesCost = 0;

    let serviceLines = List.empty<Types.ServiceProfitLine>();

    for (invoice in state.invoices.values()) {
      if (invoice.paymentStatus == #paid and inPeriod(invoice.issuedAt, period)) {
        // Líneas de mano de obra de la orden de taller asociada, en orden de
        // aparición. Sin orden asociada no hay comisión que emparejar.
        let labor : [WorkshopTypes.LaborItem] = switch (invoice.orderId) {
          case null { [] };
          case (?orderId) {
            switch (state.orders.get(orderId)) {
              case null { [] };
              case (?order) { order.labor };
            };
          };
        };

        var laborIndex = 0;
        for (line in invoice.lines.values()) {
          switch (line.kind) {
            case (#part) {
              partsIncome += line.amount;
              partsCost += line.unitCost * line.quantity;
            };
            case (#service) {
              servicesIncome += line.amount;

              // Empareja la línea de servicio con la siguiente línea de mano
              // de obra, en orden de aparición.
              let item : ?WorkshopTypes.LaborItem = if (laborIndex < labor.size()) {
                ?labor[laborIndex];
              } else {
                null;
              };
              laborIndex += 1;

              let commission : Common.Money = switch (item) {
                case null { 0 };
                case (?laborItem) { laborCommission(state, laborItem) };
              };
              servicesCost += commission;

              let technicianId : ?Common.Id = switch (item) {
                case null { null };
                case (?laborItem) { laborItem.technicianId };
              };
              let technicianName : Text = switch (technicianId) {
                case null { "" };
                case (?id) {
                  switch (state.technicians.get(id)) {
                    case null { "" };
                    case (?technician) { technician.name };
                  };
                };
              };
              let serviceId : ?Common.Id = switch (item) {
                case null { null };
                case (?laborItem) { laborItem.serviceId };
              };

              serviceLines.add({
                invoiceId = invoice.id;
                invoiceNumber = invoice.number;
                orderId = invoice.orderId;
                description = line.description;
                serviceId;
                technicianId;
                technicianName;
                charged = line.amount;
                commission;
                profit = line.amount.toInt() - commission.toInt();
              });
            };
          };
        };
      };
    };

    let partsMargin = partsIncome.toInt() - partsCost.toInt();
    let servicesMargin = servicesIncome.toInt() - servicesCost.toInt();
    let totalIncome = partsIncome + servicesIncome;
    let totalCost = partsCost + servicesCost;
    let totalMargin = totalIncome.toInt() - totalCost.toInt();

    {
      parts = {
        income = partsIncome;
        cost = partsCost;
        commission = 0;
        margin = partsMargin;
        marginBps = marginBpsOf(partsIncome, partsMargin);
      };
      services = {
        income = servicesIncome;
        cost = servicesCost;
        commission = servicesCost;
        margin = servicesMargin;
        marginBps = marginBpsOf(servicesIncome, servicesMargin);
      };
      total = {
        income = totalIncome;
        cost = totalCost;
        commission = servicesCost;
        margin = totalMargin;
        marginBps = marginBpsOf(totalIncome, totalMargin);
      };
      serviceLines = serviceLines.toArray();
      totalCommission = servicesCost;
      netProfit = totalMargin - servicesCost.toInt();
    };
  };

  public func listLedgerEntries(state : State, period : Types.AccountingPeriod) : [Types.LedgerEntry] {
    allEntries(state, period).sort(func (a, b) = Int.compare(b.date, a.date));
  };

  // --- valoración de inventario --------------------------------------------

  // Margen como puntos base sobre el valor de venta (10000 = 100 %).
  // 0 cuando el valor de venta es 0; nunca negativo.
  func marginBpsOf(saleValue : Types.Money, margin : Int) : Types.BasisPoints {
    if (saleValue == 0 or margin <= 0) {
      0;
    } else {
      (margin.toNat() * 10000) / saleValue;
    };
  };

  // Valoración completa del inventario actual, sin periodo.
  // Costo real (precio de costo × existencia), valor de venta proyectado
  // (existencia × precio de venta vigente) y margen de utilidad.
  public func getInventoryValuation(state : State) : Types.InventoryValuation {
    // Existencia por repuesto, sumando las cantidades de sus lotes en bodega.
    let unitsByPart = Map.empty<Common.Id, Nat>();
    for (lot in state.lots.values()) {
      let units = unitsByPart.get(lot.partId) ?? 0;
      unitsByPart.add(lot.partId, units + lot.quantity);
    };

    // Una fila por repuesto existente; los repuestos sin lotes quedan en cero.
    let rows = List.empty<Types.InventoryValuationRow>();
    for (part in state.parts.values()) {
      let units = unitsByPart.get(part.id) ?? 0;
      let costValue = units * part.costPrice;
      let saleValue = units * part.salePrice;
      let margin = saleValue.toInt() - costValue.toInt();
      rows.add({
        partId = part.id;
        sku = part.sku;
        name = part.name;
        category = part.category;
        units;
        costValue;
        saleValue;
        margin;
        marginBps = marginBpsOf(saleValue, margin);
      });
    };

    // Desglose agregado por categoría, ordenado por valor de venta descendente.
    let categoryNames = List.empty<Text>();
    let categoryRows = List.empty<Types.InventoryValuationCategory>();
    for (row in rows.values()) {
      var found = false;
      var i = 0;
      for (existing in categoryNames.values()) {
        if (existing == row.category) {
          let current = categoryRows.at(i);
          categoryRows.put(i, {
            category = current.category;
            partCount = current.partCount + 1;
            units = current.units + row.units;
            costValue = current.costValue + row.costValue;
            saleValue = current.saleValue + row.saleValue;
            margin = current.margin + row.margin;
            marginBps = 0;
          });
          found := true;
        };
        i += 1;
      };
      if (not found) {
        categoryNames.add(row.category);
        categoryRows.add({
          category = row.category;
          partCount = 1;
          units = row.units;
          costValue = row.costValue;
          saleValue = row.saleValue;
          margin = row.margin;
          marginBps = 0;
        });
      };
    };

    // El porcentaje se calcula sobre los totales ya agregados de la categoría.
    let byCategory = categoryRows.toArray().map(
      func (category) = {
        category = category.category;
        partCount = category.partCount;
        units = category.units;
        costValue = category.costValue;
        saleValue = category.saleValue;
        margin = category.margin;
        marginBps = marginBpsOf(category.saleValue, category.margin);
      }
    ).sort(func (a, b) = Nat.compare(b.saleValue, a.saleValue));

    // Totales generales: suman exactamente las filas y las categorías.
    var totalCostValue = 0;
    var totalSaleValue = 0;
    var totalUnits = 0;
    var partCount = 0;
    for (row in rows.values()) {
      totalCostValue += row.costValue;
      totalSaleValue += row.saleValue;
      totalUnits += row.units;
      partCount += 1;
    };
    let totalMargin = totalSaleValue.toInt() - totalCostValue.toInt();

    {
      rows = rows.toArray();
      byCategory;
      totals = {
        totalCostValue;
        totalSaleValue;
        totalMargin;
        marginBps = marginBpsOf(totalSaleValue, totalMargin);
        partCount;
        totalUnits;
      };
    };
  };
};
