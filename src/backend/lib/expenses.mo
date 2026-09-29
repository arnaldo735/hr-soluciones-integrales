import List "mo:core/List";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Runtime "mo:core/Runtime";
import Text "mo:core/Text";
import Time "mo:core/Time";

import Common "../types/common";
import Types "../types/expenses";
import ExpenseCategoryTypes "../types/expense-categories";
import PurchasingTypes "../types/purchasing";
import Search "../lib/search";

module {
  public type Counters = {
    var nextExpenseId : Nat;
  };

  public type State = {
    expenses : Map.Map<Common.Id, Types.Expense>;
    suppliers : Map.Map<Common.Id, PurchasingTypes.Supplier>;
    categories : Map.Map<Common.Id, ExpenseCategoryTypes.ExpenseCategory>;
    counters : Counters;
  };

  // --- helpers -------------------------------------------------------------

  func matches(expense : Types.Expense, filter : Types.ExpenseFilter) : Bool {
    let searchOk = switch (filter.search) {
      case null { true };
      case (?term) {
        let needle = Search.normalize(term);
        if (needle == "") { true } else {
          let supplier = expense.supplierName ?? "";
          Search.containsAny([expense.concept, supplier], needle);
        };
      };
    };
    let categoryOk = switch (filter.categoryId) {
      case null { true };
      case (?categoryId) { expense.categoryId == categoryId };
    };
    let fromOk = switch (filter.from) {
      case null { true };
      case (?from) { expense.date >= from };
    };
    let toOk = switch (filter.to) {
      case null { true };
      case (?to) { expense.date <= to };
    };
    let methodOk = switch (filter.paymentMethod) {
      case null { true };
      case (?method) { expense.paymentMethod == method };
    };
    searchOk and categoryOk and fromOk and toOk and methodOk;
  };

  func findExpense(state : State, id : Types.Id) : Types.Expense {
    state.expenses.get(id) ?? Runtime.trap("Gasto no encontrado");
  };

  // Resuelve el nombre desnormalizado de la categoría a partir de su id. Si la
  // categoría ya no existe, conserva el nombre que el gasto tenía guardado.
  func categoryNameFor(state : State, categoryId : Types.Id, fallback : Text) : Text {
    switch (state.categories.get(categoryId)) {
      case (?category) { category.name };
      case null { fallback };
    };
  };

  func supplierNameFor(state : State, supplierId : ?Types.Id) : ?Text {
    switch (supplierId) {
      case null { null };
      case (?id) {
        switch (state.suppliers.get(id)) {
          case (?supplier) { ?supplier.name };
          case null { null };
        };
      };
    };
  };

  func buildExpense(state : State, id : Types.Id, input : Types.ExpenseInput, createdAt : Types.Timestamp) : Types.Expense {
    {
      id;
      date = input.date;
      concept = input.concept;
      categoryId = input.categoryId;
      categoryName = categoryNameFor(state, input.categoryId, "");
      supplierId = input.supplierId;
      supplierName = supplierNameFor(state, input.supplierId);
      amount = input.amount;
      tax = input.tax;
      paymentMethod = input.paymentMethod;
      receiptUrl = input.receiptUrl;
      createdAt;
    };
  };

  // --- public API ----------------------------------------------------------

  public func listExpenses(state : State, filter : Types.ExpenseFilter, offset : Nat, limit : Nat) : Types.ExpensePage {
    let matched = List.empty<Types.Expense>();
    for (expense in state.expenses.values()) {
      if (matches(expense, filter)) { matched.add(expense) };
    };
    let sorted = matched.toArray().sort(func (a, b) = Nat.compare(b.id, a.id));
    let total = sorted.size();
    let start = if (offset > total) { total } else { offset };
    let end = Nat.min(start + limit, total);
    {
      items = sorted.sliceToArray(start, end);
      total;
      offset;
      limit;
      summary = summarize(state, filter);
    };
  };

  public func getExpense(state : State, id : Common.Id) : ?Types.Expense {
    state.expenses.get(id);
  };

  public func createExpense(state : State, input : Types.ExpenseInput) : Types.Expense {
    if (input.amount == 0) {
      Runtime.trap("invalidAmount");
    };
    let id = state.counters.nextExpenseId;
    state.counters.nextExpenseId := id + 1;
    let expense = buildExpense(state, id, input, Time.now());
    state.expenses.add(id, expense);
    expense;
  };

  public func updateExpense(state : State, id : Common.Id, input : Types.ExpenseInput) : Types.Expense {
    let existing = findExpense(state, id);
    if (input.amount == 0) {
      Runtime.trap("invalidAmount");
    };
    let updated = buildExpense(state, id, input, existing.createdAt);
    state.expenses.add(id, updated);
    updated;
  };

  public func deleteExpense(state : State, id : Common.Id) : Bool {
    switch (state.expenses.get(id)) {
      case null { false };
      case (?_) {
        state.expenses.remove(id);
        true;
      };
    };
  };

  public func summarize(state : State, filter : Types.ExpenseFilter) : Types.ExpenseSummary {
    var total = 0;
    var count = 0;
    let categoryIds = List.empty<Types.Id>();
    let categoryNames = List.empty<Text>();
    let categoryTotals = List.empty<Types.Money>();

    for (expense in state.expenses.values()) {
      if (matches(expense, filter)) {
        total += expense.amount;
        count += 1;

        var found = false;
        var i = 0;
        for (existingId in categoryIds.values()) {
          if (existingId == expense.categoryId) {
            categoryTotals.put(i, categoryTotals.at(i) + expense.amount);
            found := true;
          };
          i += 1;
        };
        if (not found) {
          categoryIds.add(expense.categoryId);
          categoryNames.add(expense.categoryName);
          categoryTotals.add(expense.amount);
        };
      };
    };

    let byCategory = List.empty<Types.ExpenseCategoryTotal>();
    var i = 0;
    for (categoryId in categoryIds.values()) {
      byCategory.add({
        categoryId;
        categoryName = categoryNames.at(i);
        total = categoryTotals.at(i);
      });
      i += 1;
    };

    {
      total;
      count;
      byCategory = byCategory.toArray().sort(
        func (a, b) = Text.compare(Search.sortKey(a.categoryName), Search.sortKey(b.categoryName))
      );
    };
  };
};
