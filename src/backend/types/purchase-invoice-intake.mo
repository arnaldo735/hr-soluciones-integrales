import Common "common";

module {
  public type Id = Common.Id;
  public type Timestamp = Common.Timestamp;
  public type Money = Common.Money;

  // ── Archivo subido ──────────────────────────────────────────────────────
  // Referencia al objeto persistido en el almacenamiento de archivos de la
  // plataforma. `objectId` es la clave con la que el gateway sirve los bytes.

  public type InvoiceFileKind = { #pdf; #image };

  public type InvoiceFileRef = {
    objectId : Text;
    fileName : Text;
    mimeType : Text;
    sizeBytes : Nat;
    kind : InvoiceFileKind;
    uploadedAt : Timestamp;
    // Extremos del gateway de almacenamiento tal como los conoce el frontend
    // (los mismos valores de `env.json` con los que se subió el archivo). El
    // canister no puede leer `env.json`, así que los recibe al crear el
    // borrador; sin ellos el gateway responde 403.
    gatewayUrl : ?Text;
    projectId : ?Text;
  };

  // ── Extracción ──────────────────────────────────────────────────────────

  public type ExtractionStatus = { #pending; #extracting; #extracted; #failed };

  // ── Líneas de la factura ────────────────────────────────────────────────

  // Coincidencia de la referencia de la línea con un repuesto existente.
  public type LineMatchStatus = { #new; #existing };

  // Resultado de aplicar la línea al inventario al confirmar.
  public type LineApplyStatus = { #pending; #created; #updated; #error };

  public type PurchaseInvoiceLine = {
    id : Id;
    lineNumber : Nat;
    code : Text;
    description : Text;
    quantity : Nat;
    unitCost : Money;
    matchStatus : LineMatchStatus;
    matchedPartId : ?Id;
    applyStatus : LineApplyStatus;
    applyError : ?Text;
    lotId : ?Id;
    movementId : ?Id;
    // IVA de la línea como porcentaje entero (por ejemplo 19 = 19 %).
    taxRate : Nat;
    // Descuento de la línea como porcentaje entero (por ejemplo 10 = 10 %).
    discountRate : Nat;
    // Valor total de la línea en centavos enteros.
    total : Money;
  };

  // ── Factura de compra ───────────────────────────────────────────────────

  public type PurchaseInvoiceStatus = { #pending; #confirmed; #withErrors };

  public type PurchaseInvoice = {
    id : Id;
    file : InvoiceFileRef;
    extractionStatus : ExtractionStatus;
    extractionError : ?Text;
    supplierId : ?Id;
    supplierName : ?Text;
    invoiceNumber : ?Text;
    invoiceDate : ?Timestamp;
    // NIT del proveedor detectado en la factura (cadena vacía si no aparece).
    supplierTaxId : Text;
    // Forma de pago (contado o crédito) detectada en la factura.
    paymentMethod : Text;
    // Medio de pago (efectivo, transferencia, tarjeta, etc.) detectado.
    paymentMeans : Text;
    lines : [PurchaseInvoiceLine];
    status : PurchaseInvoiceStatus;
    createdAt : Timestamp;
    updatedAt : Timestamp;
    confirmedAt : ?Timestamp;
    confirmedBy : ?Principal;
  };

  // ── Entradas de la API ──────────────────────────────────────────────────

  public type CreateInvoiceInput = {
    objectId : Text;
    fileName : Text;
    mimeType : Text;
    sizeBytes : Nat;
    kind : InvoiceFileKind;
    // URL del gateway y project id con los que el frontend subió el archivo.
    gatewayUrl : ?Text;
    projectId : ?Text;
  };

  public type InvoiceHeaderInput = {
    supplierId : ?Id;
    supplierName : ?Text;
    invoiceNumber : ?Text;
    invoiceDate : ?Timestamp;
    supplierTaxId : Text;
    paymentMethod : Text;
    paymentMeans : Text;
  };

  public type InvoiceLineInput = {
    id : ?Id;
    code : Text;
    description : Text;
    quantity : Nat;
    unitCost : Money;
    taxRate : Nat;
    discountRate : Nat;
    total : Money;
  };

  public type InvoiceReviewInput = {
    header : InvoiceHeaderInput;
    lines : [InvoiceLineInput];
  };

  // ── Consultas ───────────────────────────────────────────────────────────

  public type InvoiceFilter = {
    status : ?PurchaseInvoiceStatus;
    supplierId : ?Id;
    search : ?Text;
  };

  public type InvoiceSort = { #createdAt; #invoiceDate; #invoiceNumber };

  public type InvoicePage = {
    items : [PurchaseInvoice];
    total : Nat;
    offset : Nat;
    limit : Nat;
  };

  // ── Resultado de la confirmación ────────────────────────────────────────

  public type InvoiceApplyLineResult = {
    lineId : Id;
    lineNumber : Nat;
    code : Text;
    status : LineApplyStatus;
    partId : ?Id;
    lotId : ?Id;
    movementId : ?Id;
    error : ?Text;
  };

  public type InvoiceApplyResult = {
    invoiceId : Id;
    status : PurchaseInvoiceStatus;
    created : Nat;
    updated : Nat;
    failed : Nat;
    lines : [InvoiceApplyLineResult];
  };

  public type InvoiceError = {
    #notFound : Id;
    #notAuthorized;
    #invalidFile;
    #invalidState;
    #extractionFailed : Text;
    #invalidLine : { lineNumber : Nat; reason : Text };
  };
};
