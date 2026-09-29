import Common "common";

module {
  public type Id = Common.Id;
  public type Timestamp = Common.Timestamp;
  public type Money = Common.Money;

  // ── Citas pendientes ──────────────────────────────────────────────────────
  // Cita en estado Programada (#scheduled) o Confirmada (#confirmed).
  public type ReminderAppointment = {
    id : Id;
    customerId : Id;
    customerName : Text;
    scheduledAt : Timestamp;
    status : Text;
  };

  // ── Cuentas por cobrar ────────────────────────────────────────────────────
  // Cuenta con saldo pendiente o vencido (estado #pending o #overdue).
  public type ReminderReceivable = {
    invoiceId : Id;
    invoiceNumber : Text;
    customerName : Text;
    balance : Money;
    dueDate : Timestamp;
    status : Text;
  };

  // ── Cuentas por pagar ─────────────────────────────────────────────────────
  // Saldo pendiente o vencido por proveedor (estado #pending o #overdue).
  public type ReminderPayable = {
    supplierId : Id;
    supplierName : Text;
    balance : Money;
    dueDate : Timestamp;
    status : Text;
  };

  // ── OT sin aprobar ────────────────────────────────────────────────────────
  // Orden de taller en estado Recibida (#received).
  public type ReminderOrder = {
    id : Id;
    orderNumber : Text;
    customerName : Text;
    plate : Text;
  };

  // ── Cotizaciones pendientes por aprobación ────────────────────────────────
  // Cotización en estado Borrador (#draft) o Enviada (#sent).
  public type ReminderQuote = {
    id : Id;
    quoteNumber : Text;
    customerName : Text;
    createdAt : Timestamp;
    status : Text;
  };

  // ── Motos terminadas con más de tres días en taller ───────────────────────
  // Orden en estado Lista (#ready) cuya fecha de finalización supera los tres
  // días. `daysInWorkshop` son los días transcurridos desde la finalización.
  public type ReminderFinishedOrder = {
    id : Id;
    orderNumber : Text;
    customerName : Text;
    plate : Text;
    daysInWorkshop : Nat;
  };

  // Sección de recordatorios: conteo total de pendientes y lista acotada de
  // los ítems más relevantes. `items` se recorta a `MAX_SECTION_ITEMS`.
  public type ReminderSection<T> = {
    count : Nat;
    items : [T];
  };

  // Resumen de pendientes para la ventana de recordatorios. Cada sección es
  // `null` cuando el usuario no tiene acceso al módulo correspondiente.
  public type RemindersSummary = {
    appointments : ?ReminderSection<ReminderAppointment>;
    receivables : ?ReminderSection<ReminderReceivable>;
    payables : ?ReminderSection<ReminderPayable>;
    unapprovedOrders : ?ReminderSection<ReminderOrder>;
    pendingQuotes : ?ReminderSection<ReminderQuote>;
    finishedOrders : ?ReminderSection<ReminderFinishedOrder>;
    generatedAt : Timestamp;
  };
};
