import List "mo:core/List";
import Map "mo:core/Map";
import Runtime "mo:core/Runtime";
import Text "mo:core/Text";
import Time "mo:core/Time";

import Common "../types/common";
import Types "../types/expense-categories";
import ExpenseTypes "../types/expenses";
import Search "../lib/search";

module {
  public type Counters = {
    var nextExpenseCategoryId : Nat;
  };

  public type State = {
    categories : Map.Map<Common.Id, Types.ExpenseCategory>;
    expenses : Map.Map<Common.Id, ExpenseTypes.Expense>;
    counters : Counters;
  };

  // --- helpers -------------------------------------------------------------

  func normalize(name : Text) : Text {
    Search.normalize(name);
  };

  func matches(category : Types.ExpenseCategory, filter : Types.ExpenseCategoryFilter) : Bool {
    switch (filter.search) {
      case null { true };
      case (?term) {
        let needle = normalize(term);
        if (needle == "") { true } else {
          Search.containsAny([category.name, category.description], needle);
        };
      };
    };
  };

  func findCategory(state : State, id : Types.Id) : Types.ExpenseCategory {
    state.categories.get(id) ?? Runtime.trap("Categoría de gasto no encontrada");
  };

  func hasDuplicateName(state : State, name : Text, exceptId : ?Types.Id) : Bool {
    let needle = normalize(name);
    for (category in state.categories.values()) {
      let sameId = switch (exceptId) {
        case null { false };
        case (?id) { category.id == id };
      };
      if (not sameId and normalize(category.name) == needle) { return true };
    };
    false;
  };

  func expenseCountFor(state : State, categoryId : Types.Id) : Nat {
    var count = 0;
    for (expense in state.expenses.values()) {
      if (expense.categoryId == categoryId) { count += 1 };
    };
    count;
  };

  // Reescribe la copia desnormalizada `categoryName` de cada gasto que
  // referencia la categoría, para que un renombrado se refleje de inmediato
  // en la lista de gastos y en el reporte de contabilidad. `categoryId`
  // sigue siendo la referencia autoritativa.
  func rewriteExpenseCategoryName(state : State, categoryId : Types.Id, name : Text) {
    for (expense in state.expenses.values()) {
      if (expense.categoryId == categoryId and expense.categoryName != name) {
        state.expenses.add(expense.id, { expense with categoryName = name });
      };
    };
  };

  // --- public API ----------------------------------------------------------

  public func listCategories(state : State, filter : Types.ExpenseCategoryFilter) : [Types.ExpenseCategoryUsage] {
    let matched = List.empty<Types.ExpenseCategoryUsage>();
    for (category in state.categories.values()) {
      if (matches(category, filter)) {
        matched.add({ category; expenseCount = expenseCountFor(state, category.id) });
      };
    };
    matched.toArray().sort(
      func (a, b) = Text.compare(Search.sortKey(a.category.name), Search.sortKey(b.category.name))
    );
  };

  public func getCategory(state : State, id : Types.Id) : ?Types.ExpenseCategory {
    state.categories.get(id);
  };

  public func createCategory(state : State, input : Types.ExpenseCategoryInput) : Types.ExpenseCategory {
    if (hasDuplicateName(state, input.name, null)) {
      Runtime.trap("duplicateName: " # input.name);
    };
    let id = state.counters.nextExpenseCategoryId;
    state.counters.nextExpenseCategoryId := id + 1;
    let category : Types.ExpenseCategory = {
      id;
      name = input.name;
      description = input.description;
      createdAt = Time.now();
    };
    state.categories.add(id, category);
    category;
  };

  public func updateCategory(state : State, id : Types.Id, input : Types.ExpenseCategoryInput) : Types.ExpenseCategory {
    let existing = findCategory(state, id);
    if (hasDuplicateName(state, input.name, ?id)) {
      Runtime.trap("duplicateName: " # input.name);
    };
    let updated : Types.ExpenseCategory = {
      id;
      name = input.name;
      description = input.description;
      createdAt = existing.createdAt;
    };
    state.categories.add(id, updated);
    rewriteExpenseCategoryName(state, id, updated.name);
    updated;
  };

  public func deleteCategory(state : State, id : Types.Id) : Bool {
    let existing = findCategory(state, id);
    let expenses = expenseCountFor(state, existing.id);
    if (expenses > 0) {
      Runtime.trap("inUse: " # id.toText() # " (" # expenses.toText() # " gastos)");
    };
    state.categories.remove(id);
    true;
  };
};
