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

  // ── Inventario por agotarse ───────────────────────────────────────────────
  // Repuesto cuya existencia total está por debajo (o igual a) su umbral de
  // stock bajo. `totalStock` es la existencia sumada de todos sus lotes.
  public type ReminderLowStockPart = {
    id : Id;
    sku : Text;
    name : Text;
    totalStock : Nat;
    lowStockThreshold : Nat;
  };

  // ── Cuotas vencidas de facturas a crédito ─────────────────────────────────
  // Cuota de una factura a crédito que sigue sin pagar y cuyo vencimiento es
  // anterior a hoy. `installmentNumber` es el número de la cuota dentro del
  // plan y `amount` su valor.
  public type ReminderOverdueInstallment = {
    invoiceId : Id;
    invoiceNumber : Text;
    customerName : Text;
    installmentNumber : Nat;
    amount : Money;
    dueDate : Timestamp;
  };

  // ── Pedidos a proveedor pendientes ────────────────────────────────────────
  // Pedido a proveedor registrado (solicitud de compra en borrador). No tiene
  // estado: todo pedido registrado cuenta como pendiente.
  public type ReminderSupplierOrder = {
    id : Id;
    supplierId : Id;
    supplierName : Text;
    sku : Text;
    description : Text;
    quantity : Nat;
    createdAt : Timestamp;
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

  // Resumen de alertas del panel principal. Extiende `RemindersSummary` con las
  // secciones de inventario por agotarse, pedidos a proveedor pendientes y
  // cuotas vencidas de facturas a crédito. Cada sección es `null` cuando el rol
  // activo no tiene acceso al módulo correspondiente.
  public type DashboardAlertsSummary = {
    appointments : ?ReminderSection<ReminderAppointment>;
    receivables : ?ReminderSection<ReminderReceivable>;
    payables : ?ReminderSection<ReminderPayable>;
    unapprovedOrders : ?ReminderSection<ReminderOrder>;
    pendingQuotes : ?ReminderSection<ReminderQuote>;
    finishedOrders : ?ReminderSection<ReminderFinishedOrder>;
    lowStockParts : ?ReminderSection<ReminderLowStockPart>;
    supplierOrders : ?ReminderSection<ReminderSupplierOrder>;
    overdueInstallments : ?ReminderSection<ReminderOverdueInstallment>;
    generatedAt : Timestamp;
  };
};
