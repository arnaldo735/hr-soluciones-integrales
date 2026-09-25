import Map "mo:core/Map";

module {
  type Id = Nat;
  type Timestamp = Int;
  type Money = Nat;

  // ── Tipos de estado existentes (inlined) ────────────────────────────────

  type InvoiceFileKind = { #pdf; #image };

  type InvoiceFileRef = {
    objectId : Text;
    fileName : Text;
    mimeType : Text;
    sizeBytes : Nat;
    kind : InvoiceFileKind;
    uploadedAt : Timestamp;
    gatewayUrl : ?Text;
    projectId : ?Text;
  };

  type ExtractionStatus = { #pending; #extracting; #extracted; #failed };

  type LineMatchStatus = { #new; #existing };

  type LineApplyStatus = { #pending; #created; #updated; #error };

  // Forma anterior de la línea: sin IVA, descuento ni total.
  type OldPurchaseInvoiceLine = {
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
  };

  type PurchaseInvoiceStatus = { #pending; #confirmed; #withErrors };

  // Forma anterior de la factura: sin NIT, forma ni medio de pago.
  type OldPurchaseInvoice = {
    id : Id;
    file : InvoiceFileRef;
    extractionStatus : ExtractionStatus;
    extractionError : ?Text;
    supplierId : ?Id;
    supplierName : ?Text;
    invoiceNumber : ?Text;
    invoiceDate : ?Timestamp;
    lines : [OldPurchaseInvoiceLine];
    status : PurchaseInvoiceStatus;
    createdAt : Timestamp;
    updatedAt : Timestamp;
    confirmedAt : ?Timestamp;
    confirmedBy : ?Principal;
  };

  // ── Forma nueva: conserva NIT, forma/medio de pago y, por línea, IVA,
  //    descuento y total ───────────────────────────────────────────────────

  type PurchaseInvoiceLine = {
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
    taxRate : Nat;
    discountRate : Nat;
    total : Money;
  };

  type PurchaseInvoice = {
    id : Id;
    file : InvoiceFileRef;
    extractionStatus : ExtractionStatus;
    extractionError : ?Text;
    supplierId : ?Id;
    supplierName : ?Text;
    invoiceNumber : ?Text;
    invoiceDate : ?Timestamp;
    supplierTaxId : Text;
    paymentMethod : Text;
    paymentMeans : Text;
    lines : [PurchaseInvoiceLine];
    status : PurchaseInvoiceStatus;
    createdAt : Timestamp;
    updatedAt : Timestamp;
    confirmedAt : ?Timestamp;
    confirmedBy : ?Principal;
  };

  // Forma parcial: solo cambia `purchaseInvoices`; el resto del estado se
  // conserva tal cual (los campos no listados se heredan automáticamente).
  type OldActor = {
    purchaseInvoices : Map.Map<Id, OldPurchaseInvoice>;
  };

  type NewActor = {
    purchaseInvoices : Map.Map<Id, PurchaseInvoice>;
  };

  func migrateLine(old : OldPurchaseInvoiceLine) : PurchaseInvoiceLine {
    {
      old with
      taxRate = 0;
      discountRate = 0;
      total = 0;
    };
  };

  func migrateInvoice(old : OldPurchaseInvoice) : PurchaseInvoice {
    {
      old with
      supplierTaxId = "";
      paymentMethod = "";
      paymentMeans = "";
      lines = old.lines.map(migrateLine);
    };
  };

  public func migration(old : OldActor) : NewActor {
    {
      purchaseInvoices = old.purchaseInvoices.map(
        func(_id, invoice) = migrateInvoice(invoice)
      );
    };
  };
};
