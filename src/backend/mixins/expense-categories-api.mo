import Map "mo:core/Map";

import Common "../types/common";
import Types "../types/expense-categories";
import ExpenseTypes "../types/expenses";
import ExpenseCategoriesLib "../lib/expense-categories";

mixin (
  expenseCategories : Map.Map<Common.Id, Types.ExpenseCategory>,
  expenses : Map.Map<Common.Id, ExpenseTypes.Expense>,
  counters : ExpenseCategoriesLib.Counters,
) {
  func expenseCategoriesState() : ExpenseCategoriesLib.State = { categories = expenseCategories; expenses; counters };

  public query func listExpenseCategories(filter : Types.ExpenseCategoryFilter) : async [Types.ExpenseCategoryUsage] {
    ignore filter;
    ExpenseCategoriesLib.listCategories(expenseCategoriesState(), filter);
  };

  public query func getExpenseCategory(id : Types.Id) : async ?Types.ExpenseCategory {
    ignore id;
    ExpenseCategoriesLib.getCategory(expenseCategoriesState(), id);
  };

  public shared func createExpenseCategory(input : Types.ExpenseCategoryInput) : async Types.ExpenseCategory {
    ignore input;
    ExpenseCategoriesLib.createCategory(expenseCategoriesState(), input);
  };

  public shared func updateExpenseCategory(id : Types.Id, input : Types.ExpenseCategoryInput) : async Types.ExpenseCategory {
    ignore (id, input);
    ExpenseCategoriesLib.updateCategory(expenseCategoriesState(), id, input);
  };

  public shared func deleteExpenseCategory(id : Types.Id) : async Bool {
    ignore id;
    ExpenseCategoriesLib.deleteCategory(expenseCategoriesState(), id);
  };
};
