import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import AccessControl "mo:caffeineai-authorization/access-control";

import Common "../types/common";
import Types "../types/expenses";
import ExpenseCategoryTypes "../types/expense-categories";
import PurchasingTypes "../types/purchasing";
import UserTypes "../types/users";
import ExpensesLib "../lib/expenses";
import UsersLib "../lib/users";

mixin (
  accessControlState : AccessControl.AccessControlState,
  expenses : Map.Map<Common.Id, Types.Expense>,
  suppliers : Map.Map<Common.Id, PurchasingTypes.Supplier>,
  categories : Map.Map<Common.Id, ExpenseCategoryTypes.ExpenseCategory>,
  counters : ExpensesLib.Counters,
  credentials : Map.Map<Common.Id, UserTypes.Credential>,
  sessions : Map.Map<Text, UserTypes.Session>,
  roles : Map.Map<Common.Id, UserTypes.Role>,
) {
  func expensesState() : ExpensesLib.State = { expenses; suppliers; categories; counters };

  func requireExpensesModule(caller : Principal, token : ?Text) {
    if (not UsersLib.canAccessModule({ credentials; sessions; roles }, accessControlState, caller, token, "expenses")) {
      Runtime.trap("Unauthorized: no tiene acceso al módulo de gastos");
    };
  };

  public query ({ caller }) func listExpenses(token : ?Text, filter : Types.ExpenseFilter, offset : Nat, limit : Nat) : async Types.ExpensePage {
    requireExpensesModule(caller, token);
    ExpensesLib.listExpenses(expensesState(), filter, offset, limit);
  };

  public query ({ caller }) func getExpense(token : ?Text, id : Types.Id) : async ?Types.Expense {
    requireExpensesModule(caller, token);
    ExpensesLib.getExpense(expensesState(), id);
  };

  public shared ({ caller }) func createExpense(token : ?Text, input : Types.ExpenseInput) : async Types.Expense {
    requireExpensesModule(caller, token);
    ExpensesLib.createExpense(expensesState(), input);
  };

  public shared ({ caller }) func updateExpense(token : ?Text, id : Types.Id, input : Types.ExpenseInput) : async Types.Expense {
    requireExpensesModule(caller, token);
    ExpensesLib.updateExpense(expensesState(), id, input);
  };

  public shared ({ caller }) func deleteExpense(token : ?Text, id : Types.Id) : async Bool {
    requireExpensesModule(caller, token);
    ExpensesLib.deleteExpense(expensesState(), id);
  };

  public query ({ caller }) func getExpenseSummary(token : ?Text, filter : Types.ExpenseFilter) : async Types.ExpenseSummary {
    requireExpensesModule(caller, token);
    ExpensesLib.summarize(expensesState(), filter);
  };
};
