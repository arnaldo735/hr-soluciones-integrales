import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import AccessControl "mo:caffeineai-authorization/access-control";

import Common "../types/common";
import Types "../types/expense-categories";
import ExpenseTypes "../types/expenses";
import UserTypes "../types/users";
import ExpenseCategoriesLib "../lib/expense-categories";
import UsersLib "../lib/users";

mixin (
  accessControlState : AccessControl.AccessControlState,
  expenseCategories : Map.Map<Common.Id, Types.ExpenseCategory>,
  expenses : Map.Map<Common.Id, ExpenseTypes.Expense>,
  counters : ExpenseCategoriesLib.Counters,
  credentials : Map.Map<Common.Id, UserTypes.Credential>,
  sessions : Map.Map<Text, UserTypes.Session>,
  roles : Map.Map<Common.Id, UserTypes.Role>,
) {
  func expenseCategoriesState() : ExpenseCategoriesLib.State = { categories = expenseCategories; expenses; counters };

  func requireExpenseCategoriesModule(caller : Principal, token : ?Text) {
    if (not UsersLib.canAccessModule({ credentials; sessions; roles }, accessControlState, caller, token, "expenseCategories")) {
      Runtime.trap("Unauthorized: no tiene acceso al módulo de categorías de gastos");
    };
  };

  public query ({ caller }) func listExpenseCategories(token : ?Text, filter : Types.ExpenseCategoryFilter) : async [Types.ExpenseCategoryUsage] {
    requireExpenseCategoriesModule(caller, token);
    ExpenseCategoriesLib.listCategories(expenseCategoriesState(), filter);
  };

  public query ({ caller }) func getExpenseCategory(token : ?Text, id : Types.Id) : async ?Types.ExpenseCategory {
    requireExpenseCategoriesModule(caller, token);
    ExpenseCategoriesLib.getCategory(expenseCategoriesState(), id);
  };

  public shared ({ caller }) func createExpenseCategory(token : ?Text, input : Types.ExpenseCategoryInput) : async Types.ExpenseCategory {
    requireExpenseCategoriesModule(caller, token);
    ExpenseCategoriesLib.createCategory(expenseCategoriesState(), input);
  };

  public shared ({ caller }) func updateExpenseCategory(token : ?Text, id : Types.Id, input : Types.ExpenseCategoryInput) : async Types.ExpenseCategory {
    requireExpenseCategoriesModule(caller, token);
    ExpenseCategoriesLib.updateCategory(expenseCategoriesState(), id, input);
  };

  public shared ({ caller }) func deleteExpenseCategory(token : ?Text, id : Types.Id) : async Bool {
    requireExpenseCategoriesModule(caller, token);
    ExpenseCategoriesLib.deleteCategory(expenseCategoriesState(), id);
  };
};
