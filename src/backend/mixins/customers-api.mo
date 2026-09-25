import Map "mo:core/Map";

import Types "../types/customers";
import WorkshopTypes "../types/workshop";
import CustomersLib "../lib/customers";

mixin (
  customers : Map.Map<Types.Id, Types.Customer>,
  motorcycles : Map.Map<Types.Id, Types.Motorcycle>,
  orders : Map.Map<Types.Id, WorkshopTypes.WorkshopOrder>,
  counters : {
    var nextCustomerId : Nat;
    var nextMotorcycleId : Nat;
  },
) {
  func customersState() : CustomersLib.State = { customers; motorcycles; orders; counters };

  public query func listCustomers(search : ?Text) : async [Types.Customer] {
    CustomersLib.listCustomers(customersState(), search);
  };

  public query func getCustomer(id : Types.Id) : async ?Types.Customer {
    CustomersLib.getCustomer(customersState(), id);
  };

  public query func getCustomerDetail(id : Types.Id) : async ?Types.CustomerDetail {
    CustomersLib.getCustomerDetail(customersState(), id);
  };

  public shared func createCustomer(input : Types.CustomerInput) : async Types.Customer {
    CustomersLib.createCustomer(customersState(), input);
  };

  public shared func updateCustomer(id : Types.Id, input : Types.CustomerInput) : async Types.Customer {
    CustomersLib.updateCustomer(customersState(), id, input);
  };

  public query func listMotorcycles(customerId : Types.Id) : async [Types.Motorcycle] {
    CustomersLib.listMotorcycles(customersState(), customerId);
  };

  public query func listMotorcycleCountsByCustomers(ids : [Types.Id]) : async [(Types.Id, Nat)] {
    CustomersLib.listMotorcycleCountsByCustomers(customersState(), ids);
  };

  public query func listCustomersPage(
    filter : Types.CustomerFilter,
    sort : Types.CustomerSort,
    offset : Nat,
    limit : Nat,
  ) : async Types.CustomerPage {
    CustomersLib.listCustomersPage(customersState(), filter, sort, offset, limit);
  };

  public query func listCustomersPageDir(
    filter : Types.CustomerFilter,
    sort : Types.CustomerSort,
    descending : Bool,
    offset : Nat,
    limit : Nat,
  ) : async Types.CustomerPage {
    CustomersLib.listCustomersPageDir(customersState(), filter, sort, descending, offset, limit);
  };

  public query func listMotorcyclesPage(
    filter : Types.MotorcycleFilter,
    sort : Types.MotorcycleSort,
    offset : Nat,
    limit : Nat,
  ) : async Types.MotorcyclePage {
    CustomersLib.listMotorcyclesPage(customersState(), filter, sort, offset, limit);
  };

  public query func listMotorcyclesPageDir(
    filter : Types.MotorcycleFilter,
    sort : Types.MotorcycleSort,
    descending : Bool,
    offset : Nat,
    limit : Nat,
  ) : async Types.MotorcyclePage {
    CustomersLib.listMotorcyclesPageDir(customersState(), filter, sort, descending, offset, limit);
  };

  public query func exportCustomersAggregated() : async [Types.CustomerExportRow] {
    CustomersLib.exportCustomersAggregated(customersState());
  };

  public shared func createMotorcycle(input : Types.MotorcycleInput) : async Types.Motorcycle {
    CustomersLib.createMotorcycle(customersState(), input);
  };

  public shared func updateMotorcycle(id : Types.Id, input : Types.MotorcycleInput) : async Types.Motorcycle {
    CustomersLib.updateMotorcycle(customersState(), id, input);
  };

  public shared func bulkCreateCustomers(inputs : [Types.CustomerInput]) : async Types.BulkResult {
    ignore inputs;
    CustomersLib.bulkCreateCustomers(customersState(), inputs);
  };

  public shared func bulkUpdateCustomers(updates : [(Types.Id, Types.CustomerInput)]) : async Types.BulkResult {
    ignore updates;
    CustomersLib.bulkUpdateCustomers(customersState(), updates);
  };
};
