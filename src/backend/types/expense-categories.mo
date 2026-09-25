import Common "common";

module {
  public type Id = Common.Id;
  public type Timestamp = Common.Timestamp;

  // Entidad administrable de categoría de gasto. Reemplaza la lista fija de
  // 8 variantes: ahora el usuario puede crear, renombrar y eliminar
  // categorías. `name` es único (comparación sin distinguir mayúsculas ni
  // espacios externos).
  public type ExpenseCategory = {
    id : Id;
    name : Text;
    description : Text;
    createdAt : Timestamp;
  };

  public type ExpenseCategoryInput = {
    name : Text;
    description : Text;
  };

  public type ExpenseCategoryFilter = {
    search : ?Text;
  };

  // Uso de una categoría: cuántos gastos la referencian. `expenseCount` es la
  // guarda de eliminación (una categoría en uso no se puede eliminar).
  public type ExpenseCategoryUsage = {
    category : ExpenseCategory;
    expenseCount : Nat;
  };

  public type ExpenseCategoryError = {
    #notFound : Id;
    #duplicateName : Text;
    #inUse : { categoryId : Id; expenses : Nat };
    #notAuthorized;
  };
};
