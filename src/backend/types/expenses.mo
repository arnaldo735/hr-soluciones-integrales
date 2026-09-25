import Common "common";

module {
  public type Id = Common.Id;
  public type Timestamp = Common.Timestamp;
  public type Money = Common.Money;

  // La categoría de un gasto pasa a ser una referencia a una entidad
  // administrable (`ExpenseCategory` en types/expense-categories.mo).
  // `categoryId` es la referencia autoritativa; `categoryName` es una copia
  // desnormalizada del nombre al momento de crear/editar el gasto, para que
  // los gastos existentes conserven su categoría aunque la entidad se
  // renombre o se elimine. La migración mapea cada variante antigua a la
  // categoría sembrada correspondiente y rellena ambos campos.
  public type Expense = {
    id : Id;
    date : Timestamp;
    concept : Text;
    categoryId : Id;
    categoryName : Text;
    supplierId : ?Id;
    supplierName : ?Text;
    amount : Money;
    tax : Money;
    paymentMethod : Text;
    receiptUrl : ?Text;
    createdAt : Timestamp;
  };

  public type ExpenseInput = {
    date : Timestamp;
    concept : Text;
    categoryId : Id;
    supplierId : ?Id;
    amount : Money;
    tax : Money;
    paymentMethod : Text;
    receiptUrl : ?Text;
  };

  public type ExpenseFilter = {
    search : ?Text;
    categoryId : ?Id;
    from : ?Timestamp;
    to : ?Timestamp;
    paymentMethod : ?Text;
  };

  public type ExpenseCategoryTotal = {
    categoryId : Id;
    categoryName : Text;
    total : Money;
  };

  public type ExpenseSummary = {
    total : Money;
    count : Nat;
    byCategory : [ExpenseCategoryTotal];
  };

  public type ExpensePage = {
    items : [Expense];
    total : Nat;
    offset : Nat;
    limit : Nat;
    summary : ExpenseSummary;
  };

  public type ExpenseError = {
    #notFound : Id;
    #invalidAmount;
    #notAuthorized;
  };
};
