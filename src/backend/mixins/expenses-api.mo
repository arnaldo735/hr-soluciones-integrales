import Map "mo:core/Map";

import Common "../types/common";
import Types "../types/expenses";
import ExpenseCategoryTypes "../types/expense-categories";
import PurchasingTypes "../types/purchasing";
import ExpensesLib "../lib/expenses";

mixin (
  expenses : Map.Map<Common.Id, Types.Expense>,
  suppliers : Map.Map<Common.Id, PurchasingTypes.Supplier>,
  categories : Map.Map<Common.Id, ExpenseCategoryTypes.ExpenseCategory>,
  counters : ExpensesLib.Counters,
) {
  func expensesState() : ExpensesLib.State = { expenses; suppliers; categories; counters };

  public query func listExpenses(filter : Types.ExpenseFilter, offset : Nat, limit : Nat) : async Types.ExpensePage {
    ignore (filter, offset, limit);
    ExpensesLib.listExpenses(expensesState(), filter, offset, limit);
  };

  public query func getExpense(id : Types.Id) : async ?Types.Expense {
    ignore id;
    ExpensesLib.getExpense(expensesState(), id);
  };

  public shared func createExpense(input : Types.ExpenseInput) : async Types.Expense {
    ignore input;
    ExpensesLib.createExpense(expensesState(), input);
  };

  public shared func updateExpense(id : Types.Id, input : Types.ExpenseInput) : async Types.Expense {
    ignore (id, input);
    ExpensesLib.updateExpense(expensesState(), id, input);
  };

  public shared func deleteExpense(id : Types.Id) : async Bool {
    ignore id;
    ExpensesLib.deleteExpense(expensesState(), id);
  };

  public query func getExpenseSummary(filter : Types.ExpenseFilter) : async Types.ExpenseSummary {
    ignore filter;
    ExpensesLib.summarize(expensesState(), filter);
  };
};
