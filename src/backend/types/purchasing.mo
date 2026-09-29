import Common "common";

module {
  public type Id = Common.Id;
  public type Timestamp = Common.Timestamp;
  public type Money = Common.Money;

  public type Supplier = {
    id : Id;
    name : Text;
    contactName : ?Text;
    phone : Text;
    email : ?Text;
    taxId : ?Text;
    address : ?Text;
    createdAt : Timestamp;
  };

  public type SupplierInput = {
    name : Text;
    contactName : ?Text;
    phone : Text;
    email : ?Text;
    taxId : ?Text;
    address : ?Text;
  };

  public type PurchaseItem = {
    id : Id;
    partId : Id;
    lotNumber : Text;
    quantity : Nat;
    unitCost : Money;
  };

  // Compra a proveedor. `accepted` indica si la compra ya fue
  // aceptada/confirmada: una compra no aceptada (`accepted = false`) puede
  // eliminarse y revierte sus lotes y movimientos de inventario; una compra
  // aceptada ya afectó el inventario y no se puede eliminar.
  public type Purchase = {
    id : Id;
    supplierId : Id;
    items : [PurchaseItem];
    total : Money;
    paidAmount : Money;
    accepted : Bool;
    createdAt : Timestamp;
  };

  public type PaymentMethod = { #cash; #card; #transfer; #mixed };

  public type Payment = {
    id : Id;
    supplierId : Id;
    purchaseId : ?Id;
    amount : Money;
    method : PaymentMethod;
    note : ?Text;
    performedBy : Principal;
    at : Timestamp;
  };

  // Estado de una cuenta por pagar: `#pending` = saldo pendiente y aún no
  // vencida; `#overdue` = saldo pendiente con vencimiento pasado; `#paid` =
  // sin saldo pendiente.
  public type PayableStatus = { #pending; #overdue; #paid };

  public type Payable = {
    supplierId : Id;
    supplierName : Text;
    totalPurchased : Money;
    totalPaid : Money;
    balance : Money;
    dueDate : Timestamp;
    status : PayableStatus;
  };

  public type PurchaseInput = {
    supplierId : Id;
    items : [PurchaseItemInput];
  };

  public type PurchaseItemInput = {
    partId : Id;
    lotNumber : Text;
    quantity : Nat;
    unitCost : Money;
  };

  public type PaymentInput = {
    supplierId : Id;
    purchaseId : ?Id;
    amount : Money;
    method : PaymentMethod;
    note : ?Text;
  };

  public type PurchasingError = {
    #notFound : Id;
    #invalidAmount;
    #notAuthorized;
    // La compra no se puede eliminar porque ya fue aceptada, tiene pagos o ya
    // afectó el inventario.
    #purchaseAccepted;
  };
};
