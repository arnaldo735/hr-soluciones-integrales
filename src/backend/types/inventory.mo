import Common "common";

module {
  public type Id = Common.Id;
  public type Timestamp = Common.Timestamp;
  public type Money = Common.Money;

  public type Part = {
    id : Id;
    sku : Text;
    name : Text;
    category : Text;
    brand : Text;
    unit : Text;
    salePrice : Money;
    costPrice : Money;
    lowStockThreshold : Nat;
    createdAt : Timestamp;
  };

  public type PartView = {
    id : Id;
    sku : Text;
    name : Text;
    category : Text;
    brand : Text;
    unit : Text;
    salePrice : Money;
    costPrice : Money;
    lowStockThreshold : Nat;
    totalStock : Nat;
    lowStock : Bool;
    createdAt : Timestamp;
  };

  public type Lot = {
    id : Id;
    partId : Id;
    lotNumber : Text;
    quantity : Nat;
    unitCost : Money;
    supplierId : ?Id;
    purchaseId : ?Id;
    receivedAt : Timestamp;
  };

  public type MovementKind = { #sale; #purchase; #adjustment };

  public type Movement = {
    id : Id;
    partId : Id;
    lotId : ?Id;
    kind : MovementKind;
    quantity : Nat;
    unitCost : ?Money;
    reason : ?Text;
    referenceId : ?Id;
    performedBy : Principal;
    at : Timestamp;
  };

  public type AdjustmentDirection = { #in_; #out };

  public type PartInput = {
    sku : Text;
    name : Text;
    category : Text;
    brand : Text;
    unit : Text;
    salePrice : Money;
    costPrice : Money;
    lowStockThreshold : Nat;
  };

  public type AdjustmentInput = {
    partId : Id;
    lotId : ?Id;
    direction : AdjustmentDirection;
    quantity : Nat;
    reason : Text;
  };

  public type PartFilter = {
    search : ?Text;
    category : ?Text;
    brand : ?Text;
    lowStockOnly : ?Bool;
  };

  public type PartSort = { #name; #sku; #stock; #createdAt };

  public type PartPage = {
    items : [PartView];
    total : Nat;
    offset : Nat;
    limit : Nat;
  };

  // Valores distintos de categoría y marca del catálogo, para poblar los
  // filtros sin descargar el catálogo entero.
  public type PartFacets = {
    categories : [Text];
    brands : [Text];
  };

  public type InventoryError = {
    #notFound : Id;
    #duplicateSku : Text;
    #invalidQuantity;
    #insufficientStock : { partId : Id; available : Nat; requested : Nat };
    #notAuthorized;
  };

  // ── Importación masiva (CSV) ────────────────────────────────────────────
  // El frontend parsea y valida el CSV; el backend recibe filas ya
  // normalizadas y devuelve un resumen por fila.

  public type BulkRowResult = {
    index : Nat;
    ok : Bool;
    id : ?Id;
    error : ?Text;
  };

  public type BulkResult = {
    created : Nat;
    updated : Nat;
    skipped : Nat;
    failed : Nat;
    rows : [BulkRowResult];
  };

  // ── Importación / exportación de inventario (CSV) ───────────────────────
  // El backend expone las filas crudas del inventario para que el frontend
  // genere el CSV de exportación, y acepta filas ya parseadas del CSV de
  // importación, creando o actualizando por SKU.

  public type InventoryCsvRow = {
    sku : Text;
    name : Text;
    category : Text;
    brand : Text;
    unit : Text;
    salePrice : Money;
    costPrice : Money;
    lowStockThreshold : Nat;
    quantity : Nat;
  };

  public type InventoryImportRow = {
    rowNumber : Nat;
    sku : Text;
    name : Text;
    category : Text;
    brand : Text;
    unit : Text;
    salePrice : Money;
    costPrice : Money;
    lowStockThreshold : Nat;
    quantity : Nat;
  };

  public type InventoryImportRowResult = {
    rowNumber : Nat;
    sku : Text;
    status : ImportRowStatus;
    id : ?Id;
    error : ?Text;
  };

  public type ImportRowStatus = { #created; #updated; #error };

  public type InventoryImportResult = {
    created : Nat;
    updated : Nat;
    failed : Nat;
    rows : [InventoryImportRowResult];
  };

  // ── Puesta en ceros del inventario ──────────────────────────────────────
  // Resumen de la operación que deja en cero la existencia de todos los
  // repuestos. `affected` cuenta los repuestos cuya existencia cambió.

  public type ZeroInventoryResult = {
    affected : Nat;
  };
};
