import List "mo:core/List";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Time "mo:core/Time";

import Common "../types/common";
import Types "../types/reminders";
import AppointmentTypes "../types/appointments";
import ReceivableTypes "../types/receivables";
import PurchasingTypes "../types/purchasing";
import QuoteTypes "../types/quotes";
import WorkshopTypes "../types/workshop";
import CustomerTypes "../types/customers";
import BillingTypes "../types/billing";
import InventoryTypes "../types/inventory";

import ReceivablesLib "../lib/receivables";
import PurchasingLib "../lib/purchasing";

module {
  // Máximo de ítems devueltos por sección; el conteo total no se recorta.
  public let MAX_SECTION_ITEMS : Nat = 10;

  // Días que una orden terminada (#ready) puede permanecer en taller antes de
  // aparecer en los recordatorios.
  public let FINISHED_ORDER_DAY_NS : Int = 86_400_000_000_000;
  public let FINISHED_ORDER_DAYS : Nat = 3;

  // Estado de dominio que necesita la agregación. Reutiliza los `State` de los
  // libs de dominio existentes para no duplicar lógica.
  public type State = {
    appointments : Map.Map<Common.Id, AppointmentTypes.Appointment>;
    invoices : Map.Map<Common.Id, BillingTypes.Invoice>;
    receivablePayments : Map.Map<Common.Id, ReceivableTypes.ReceivablePayment>;
    suppliers : Map.Map<Common.Id, PurchasingTypes.Supplier>;
    purchases : Map.Map<Common.Id, PurchasingTypes.Purchase>;
    payments : Map.Map<Common.Id, PurchasingTypes.Payment>;
    quotes : Map.Map<Common.Id, QuoteTypes.Quote>;
    orders : Map.Map<Common.Id, WorkshopTypes.WorkshopOrder>;
    customers : Map.Map<Common.Id, CustomerTypes.Customer>;
    motorcycles : Map.Map<Common.Id, CustomerTypes.Motorcycle>;
  };

  // --- helpers -------------------------------------------------------------

  func customerName(state : State, customerId : Common.Id) : Text {
    switch (state.customers.get(customerId)) {
      case (?customer) { customer.name };
      case null { "" };
    };
  };

  func plateFor(state : State, motorcycleId : Common.Id) : Text {
    switch (state.motorcycles.get(motorcycleId)) {
      case (?moto) { moto.plate };
      case null { "" };
    };
  };

  func appointmentStatusText(status : AppointmentTypes.AppointmentStatus) : Text {
    switch (status) {
      case (#scheduled) { "scheduled" };
      case (#confirmed) { "confirmed" };
      case (#attended) { "attended" };
      case (#cancelled) { "cancelled" };
      case (#noShow) { "noShow" };
    };
  };

  func receivableStatusText(status : ReceivableTypes.ReceivableStatus) : Text {
    switch (status) {
      case (#pending) { "pending" };
      case (#overdue) { "overdue" };
      case (#paid) { "paid" };
    };
  };

  func payableStatusText(status : PurchasingTypes.PayableStatus) : Text {
    switch (status) {
      case (#pending) { "pending" };
      case (#overdue) { "overdue" };
      case (#paid) { "paid" };
    };
  };

  func quoteStatusText(status : QuoteTypes.QuoteStatus) : Text {
    switch (status) {
      case (#draft) { "draft" };
      case (#sent) { "sent" };
      case (#accepted) { "accepted" };
      case (#rejected) { "rejected" };
      case (#expired) { "expired" };
    };
  };

  // Recorta la lista a `MAX_SECTION_ITEMS` conservando el orden recibido.
  func section<T>(items : [T]) : Types.ReminderSection<T> {
    let count = items.size();
    let limited = if (count > MAX_SECTION_ITEMS) {
      items.sliceToArray(0, MAX_SECTION_ITEMS);
    } else {
      items;
    };
    { count; items = limited };
  };

  // --- secciones -----------------------------------------------------------

  // Citas en estado Programada (#scheduled) o Confirmada (#confirmed),
  // ordenadas por fecha más próxima.
  func appointmentsSection(state : State) : Types.ReminderSection<Types.ReminderAppointment> {
    let out = List.empty<Types.ReminderAppointment>();
    for (appointment in state.appointments.values()) {
      switch (appointment.status) {
        case (#scheduled) {};
        case (#confirmed) {};
        case (_) { continue };
      };
      out.add({
        id = appointment.id;
        customerId = appointment.customerId;
        customerName = customerName(state, appointment.customerId);
        scheduledAt = appointment.scheduledAt;
        status = appointmentStatusText(appointment.status);
      });
    };
    let sorted = out.toArray().sort(func (a, b) = Int.compare(a.scheduledAt, b.scheduledAt));
    section(sorted);
  };

  // Cuentas por cobrar con saldo pendiente o vencido (estado #pending o
  // #overdue), ordenadas por vencimiento más próximo.
  func receivablesSection(state : State) : Types.ReminderSection<Types.ReminderReceivable> {
    let receivables = ReceivablesLib.listReceivables(
      { invoices = state.invoices; receivablePayments = state.receivablePayments; counters = { var nextReceivablePaymentId = 0 } },
      { status = null; search = null },
    );
    let out = List.empty<Types.ReminderReceivable>();
    for (receivable in receivables.values()) {
      switch (receivable.status) {
        case (#pending) {};
        case (#overdue) {};
        case (#paid) { continue };
      };
      out.add({
        invoiceId = receivable.invoiceId;
        invoiceNumber = receivable.invoiceNumber;
        customerName = receivable.customerName;
        balance = receivable.balance;
        dueDate = receivable.dueDate;
        status = receivableStatusText(receivable.status);
      });
    };
    let sorted = out.toArray().sort(func (a, b) = Int.compare(a.dueDate, b.dueDate));
    section(sorted);
  };

  // Cuentas por pagar con saldo pendiente o vencido por proveedor (estado
  // #pending o #overdue), ordenadas por vencimiento más próximo.
  func payablesSection(state : State) : Types.ReminderSection<Types.ReminderPayable> {
    let payables = PurchasingLib.listPayables({
      suppliers = state.suppliers;
      purchases = state.purchases;
      payments = state.payments;
      lots = Map.empty();
      movements = Map.empty();
      counters = {
        var nextSupplierId = 0;
        var nextPurchaseId = 0;
        var nextPurchaseItemId = 0;
        var nextPaymentId = 0;
        var nextLotId = 0;
        var nextMovementId = 0;
      };
    });
    let out = List.empty<Types.ReminderPayable>();
    for (payable in payables.values()) {
      switch (payable.status) {
        case (#pending) {};
        case (#overdue) {};
        case (#paid) { continue };
      };
      out.add({
        supplierId = payable.supplierId;
        supplierName = payable.supplierName;
        balance = payable.balance;
        dueDate = payable.dueDate;
        status = payableStatusText(payable.status);
      });
    };
    let sorted = out.toArray().sort(func (a, b) = Int.compare(a.dueDate, b.dueDate));
    section(sorted);
  };

  // Órdenes de taller en estado Recibida (#received), ordenadas por id
  // descendente (más recientes primero).
  func unapprovedOrdersSection(state : State) : Types.ReminderSection<Types.ReminderOrder> {
    let out = List.empty<Types.ReminderOrder>();
    for (order in state.orders.values()) {
      if (order.status != #received) { continue };
      out.add({
        id = order.id;
        orderNumber = order.orderNumber;
        customerName = customerName(state, order.customerId);
        plate = plateFor(state, order.motorcycleId);
      });
    };
    let sorted = out.toArray().sort(func (a, b) = Nat.compare(b.id, a.id));
    section(sorted);
  };

  // Cotizaciones en estado Borrador (#draft) o Enviada (#sent), ordenadas por
  // fecha de creación descendente (más recientes primero).
  func pendingQuotesSection(state : State) : Types.ReminderSection<Types.ReminderQuote> {
    let out = List.empty<Types.ReminderQuote>();
    for (quote in state.quotes.values()) {
      switch (quote.status) {
        case (#draft) {};
        case (#sent) {};
        case (_) { continue };
      };
      out.add({
        id = quote.id;
        quoteNumber = quote.quoteNumber;
        customerName = customerName(state, quote.customerId);
        createdAt = quote.createdAt;
        status = quoteStatusText(quote.status);
      });
    };
    let sorted = out.toArray().sort(func (a, b) = Int.compare(b.createdAt, a.createdAt));
    section(sorted);
  };

  // Momento en que la orden quedó Lista (#ready): la última transición a
  // `#ready` del historial; si no está disponible, `updatedAt`.
  func readyAt(order : WorkshopTypes.WorkshopOrder) : Common.Timestamp {
    var at : ?Common.Timestamp = null;
    for (change in order.statusHistory.values()) {
      if (change.to == #ready) { at := ?change.at };
    };
    at ?? order.updatedAt;
  };

  // Órdenes en estado Lista (#ready) cuya finalización supera los tres días,
  // ordenadas por días transcurridos descendente (las más antiguas primero).
  func finishedOrdersSection(state : State, now : Common.Timestamp) : Types.ReminderSection<Types.ReminderFinishedOrder> {
    let threshold : Int = FINISHED_ORDER_DAYS * FINISHED_ORDER_DAY_NS;
    let out = List.empty<Types.ReminderFinishedOrder>();
    for (order in state.orders.values()) {
      if (order.status != #ready) { continue };
      let elapsed = now - readyAt(order);
      if (elapsed <= threshold) { continue };
      let days = (elapsed / FINISHED_ORDER_DAY_NS).toNat();
      out.add({
        id = order.id;
        orderNumber = order.orderNumber;
        customerName = customerName(state, order.customerId);
        plate = plateFor(state, order.motorcycleId);
        daysInWorkshop = days;
      });
    };
    let sorted = out.toArray().sort(func (a, b) = Nat.compare(b.daysInWorkshop, a.daysInWorkshop));
    section(sorted);
  };

  // --- API -----------------------------------------------------------------

  // Resumen de pendientes. Cada sección es `null` cuando el llamador no tiene
  // acceso al módulo correspondiente; el mixin decide el gating y pasa `null`
  // en las secciones no autorizadas.
  public func getRemindersSummary(
    state : State,
    includeAppointments : Bool,
    includeReceivables : Bool,
    includePayables : Bool,
    includeUnapprovedOrders : Bool,
    includePendingQuotes : Bool,
    includeFinishedOrders : Bool,
  ) : Types.RemindersSummary {
    let now = Time.now();
    {
      appointments = if (includeAppointments) { ?appointmentsSection(state) } else { null };
      receivables = if (includeReceivables) { ?receivablesSection(state) } else { null };
      payables = if (includePayables) { ?payablesSection(state) } else { null };
      unapprovedOrders = if (includeUnapprovedOrders) { ?unapprovedOrdersSection(state) } else { null };
      pendingQuotes = if (includePendingQuotes) { ?pendingQuotesSection(state) } else { null };
      finishedOrders = if (includeFinishedOrders) { ?finishedOrdersSection(state, now) } else { null };
      generatedAt = now;
    };
  };
};
