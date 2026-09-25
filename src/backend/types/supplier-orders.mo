import Common "common";

module {
  public type Id = Common.Id;
  public type Timestamp = Common.Timestamp;

  // Pedido a proveedor: solo cantidad, SKU y descripción. No mueve inventario
  // ni genera cuentas por pagar; es una solicitud de compra en borrador.
  public type SupplierOrder = {
    id : Id;
    supplierId : Id;
    quantity : Nat;
    sku : Text;
    description : Text;
    createdBy : Principal;
    createdAt : Timestamp;
  };

  public type SupplierOrderInput = {
    supplierId : Id;
    quantity : Nat;
    sku : Text;
    description : Text;
  };

  public type SupplierOrderFilter = {
    supplierId : ?Id;
    search : ?Text;
  };

  public type SupplierOrderError = {
    #notFound : Id;
    #supplierNotFound : Id;
    #invalidQuantity;
    #notAuthorized;
  };
};
