import Common "common";

module {
  public type Id = Common.Id;
  public type Timestamp = Common.Timestamp;
  public type Money = Common.Money;

  // Naturaleza de un asiento del libro de movimientos.
  //   #income     : ingreso (suma a la utilidad).
  //   #expense    : gasto (resta de la utilidad).
  //   #commission : comisión de técnico (resta de la utilidad). Se muestra
  //                 como movimiento propio para que el libro refleje la
  //                 comisión que reduce la utilidad neta.
  public type LedgerEntryKind = { #income; #expense; #commission };

  public type LedgerEntry = {
    id : Id;
    kind : LedgerEntryKind;
    date : Timestamp;
    concept : Text;
    category : Text;
    amount : Money;
    referenceId : ?Id;
    referenceType : ?Text;
  };

  public type AccountingPeriod = {
    from : ?Timestamp;
    to : ?Timestamp;
  };

  // Resumen contable del periodo.
  //   totalIncome       : ingresos por facturas pagadas.
  //   totalExpenses     : gastos operativos.
  //   totalCommissions  : comisiones de técnicos del periodo (costo que
  //                       reduce la utilidad).
  //   profit            : utilidad bruta = totalIncome − totalExpenses.
  //   netProfit         : utilidad neta = profit − totalCommissions. Es la
  //                       utilidad consolidada después de comisiones.
  public type AccountingSummary = {
    from : ?Timestamp;
    to : ?Timestamp;
    totalIncome : Money;
    totalExpenses : Money;
    totalCommissions : Money;
    profit : Int;
    netProfit : Int;
    invoiceCount : Nat;
    expenseCount : Nat;
  };

  public type CategoryBreakdown = {
    category : Text;
    total : Money;
  };

  public type PaymentMethodBreakdown = {
    method : Text;
    total : Money;
  };

  public type AccountingReport = {
    summary : AccountingSummary;
    byExpenseCategory : [CategoryBreakdown];
    byPaymentMethod : [PaymentMethodBreakdown];
    entries : [LedgerEntry];
    profit : ProfitBreakdown;
  };

  // ── Utilidad de repuestos vs servicios por rango de fechas ──────────────
  // Cada bloque muestra ingreso, costo, comisión y margen del periodo. El
  // total consolidado suma ambos bloques. Unidades monetarias: centavos
  // enteros. `margin` puede ser negativo; `marginBps` es el margen en puntos
  // base sobre el ingreso (10000 = 100 %), 0 si el ingreso es 0.
  //
  // Para el bloque de servicios, `cost` es la comisión del técnico realmente
  // pagada o adeudada por cada línea de servicio (ver `ServiceProfitLine`).
  // Para el bloque de repuestos, `cost` sigue siendo `unitCost × quantity`.
  // `commission` es la comisión agregada del bloque: igual a `cost` en
  // servicios y 0 en repuestos.

  public type ProfitBlock = {
    income : Money;
    cost : Money;
    commission : Money;
    margin : Int;
    marginBps : BasisPoints;
  };

  // Desglose por línea de servicio de una factura pagada del periodo.
  //   invoiceId       : factura de la que proviene la línea.
  //   invoiceNumber   : número legible de la factura.
  //   orderId         : orden de taller asociada, si la factura provino de una.
  //   description     : descripción de la línea de servicio.
  //   serviceId       : servicio del catálogo, si la línea provino de él.
  //   technicianId    : técnico responsable, si la línea tiene uno asignado.
  //   technicianName  : nombre del técnico, vacío si no aplica.
  //   charged         : valor cobrado por la línea (su `amount`).
  //   commission      : comisión del técnico por la línea; 0 si la línea no
  //                     genera comisión (sin técnico, sin servicio del
  //                     catálogo, o servicio de categoría "Servicio de
  //                     terceros").
  //   profit          : charged − commission (puede ser negativo).
  public type ServiceProfitLine = {
    invoiceId : Id;
    invoiceNumber : Text;
    orderId : ?Id;
    description : Text;
    serviceId : ?Id;
    technicianId : ?Id;
    technicianName : Text;
    charged : Money;
    commission : Money;
    profit : Int;
  };

  public type ProfitBreakdown = {
    parts : ProfitBlock;
    services : ProfitBlock;
    total : ProfitBlock;
    serviceLines : [ServiceProfitLine];
    // Comisión total de técnicos del periodo (suma de `services.commission`).
    // Es el costo que el total consolidado descuenta para obtener la utilidad
    // neta.
    totalCommission : Money;
    // Utilidad neta consolidada = total.margin − totalCommission. Puede ser
    // negativa.
    netProfit : Int;
  };

  public type AccountingError = {
    #notAuthorized;
  };

  // ── Valoración de inventario ────────────────────────────────────────────
  // Informe del valor del inventario en bodega, sin periodo: costo real,
  // valor de venta proyectado y margen de utilidad.
  //
  // Unidades monetarias: centavos enteros (Money = Nat).
  // Porcentajes: puntos base enteros (BasisPoints = Nat), donde 10000 = 100 %.
  // El frontend los formatea dividiendo entre 100 para obtener el porcentaje.

  public type BasisPoints = Nat;

  // Fila de valoración de un repuesto.
  //   units        : existencia total en bodega (suma de cantidades de lotes).
  //   costValue    : costo real = precio de costo del repuesto × existencia actual.
  //   saleValue    : valor de venta proyectado = units × precio de venta vigente.
  //   margin       : saleValue − costValue (puede ser negativo si el costo
  //                  real supera el precio de venta).
  //   marginBps    : margen como puntos base sobre saleValue; 0 si saleValue = 0.
  public type InventoryValuationRow = {
    partId : Id;
    sku : Text;
    name : Text;
    category : Text;
    units : Nat;
    costValue : Money;
    saleValue : Money;
    margin : Int;
    marginBps : BasisPoints;
  };

  // Desglose agregado por categoría. Los campos suman exactamente los mismos
  // totales que InventoryValuationTotals.
  public type InventoryValuationCategory = {
    category : Text;
    partCount : Nat;
    units : Nat;
    costValue : Money;
    saleValue : Money;
    margin : Int;
    marginBps : BasisPoints;
  };

  // Totales generales del informe.
  //   totalCostValue : suma de costValue de todas las filas.
  //   totalSaleValue : suma de saleValue de todas las filas.
  //   totalMargin    : totalSaleValue − totalCostValue.
  //   marginBps      : totalMargin como puntos base sobre totalSaleValue;
  //                    0 si totalSaleValue = 0.
  //   partCount      : número de repuestos valorados.
  //   totalUnits     : unidades totales en bodega.
  public type InventoryValuationTotals = {
    totalCostValue : Money;
    totalSaleValue : Money;
    totalMargin : Int;
    marginBps : BasisPoints;
    partCount : Nat;
    totalUnits : Nat;
  };

  public type InventoryValuation = {
    rows : [InventoryValuationRow];
    byCategory : [InventoryValuationCategory];
    totals : InventoryValuationTotals;
  };
};
