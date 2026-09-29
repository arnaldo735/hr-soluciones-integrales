import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import AccessControl "mo:caffeineai-authorization/access-control";

import Common "../types/common";
import Types "../types/customers";
import WorkshopTypes "../types/workshop";
import UserTypes "../types/users";
import CustomersLib "../lib/customers";
import UsersLib "../lib/users";

mixin (
  accessControlState : AccessControl.AccessControlState,
  customers : Map.Map<Types.Id, Types.Customer>,
  motorcycles : Map.Map<Types.Id, Types.Motorcycle>,
  orders : Map.Map<Types.Id, WorkshopTypes.WorkshopOrder>,
  counters : {
    var nextCustomerId : Nat;
    var nextMotorcycleId : Nat;
  },
  credentials : Map.Map<Common.Id, UserTypes.Credential>,
  sessions : Map.Map<Text, UserTypes.Session>,
  roles : Map.Map<Common.Id, UserTypes.Role>,
) {
  func customersState() : CustomersLib.State = { customers; motorcycles; orders; counters };

  func requireCustomersModule(caller : Principal, token : ?Text) {
    if (not UsersLib.canAccessModule({ credentials; sessions; roles }, accessControlState, caller, token, "customers")) {
      Runtime.trap("Unauthorized: no tiene acceso al módulo de clientes");
    };
  };

  func requireMotorcyclesModule(caller : Principal, token : ?Text) {
    if (not UsersLib.canAccessModule({ credentials; sessions; roles }, accessControlState, caller, token, "motorcycles")) {
      Runtime.trap("Unauthorized: no tiene acceso al módulo de motos");
    };
  };

  public query ({ caller }) func listCustomers(token : ?Text, search : ?Text) : async [Types.Customer] {
    requireCustomersModule(caller, token);
    CustomersLib.listCustomers(customersState(), search);
  };

  public query ({ caller }) func getCustomer(token : ?Text, id : Types.Id) : async ?Types.Customer {
    requireCustomersModule(caller, token);
    CustomersLib.getCustomer(customersState(), id);
  };

  public query ({ caller }) func getCustomerDetail(token : ?Text, id : Types.Id) : async ?Types.CustomerDetail {
    requireCustomersModule(caller, token);
    CustomersLib.getCustomerDetail(customersState(), id);
  };

  public shared ({ caller }) func createCustomer(token : ?Text, input : Types.CustomerInput) : async Types.Customer {
    requireCustomersModule(caller, token);
    CustomersLib.createCustomer(customersState(), input);
  };

  public shared ({ caller }) func updateCustomer(token : ?Text, id : Types.Id, input : Types.CustomerInput) : async Types.Customer {
    requireCustomersModule(caller, token);
    CustomersLib.updateCustomer(customersState(), id, input);
  };

  public query ({ caller }) func listMotorcycles(token : ?Text, customerId : Types.Id) : async [Types.Motorcycle] {
    requireMotorcyclesModule(caller, token);
    CustomersLib.listMotorcycles(customersState(), customerId);
  };

  public query ({ caller }) func listMotorcycleCountsByCustomers(token : ?Text, ids : [Types.Id]) : async [(Types.Id, Nat)] {
    requireMotorcyclesModule(caller, token);
    CustomersLib.listMotorcycleCountsByCustomers(customersState(), ids);
  };

  public query ({ caller }) func listCustomersPage(
    token : ?Text,
    filter : Types.CustomerFilter,
    sort : Types.CustomerSort,
    offset : Nat,
    limit : Nat,
  ) : async Types.CustomerPage {
    requireCustomersModule(caller, token);
    CustomersLib.listCustomersPage(customersState(), filter, sort, offset, limit);
  };

  public query ({ caller }) func listCustomersPageDir(
    token : ?Text,
    filter : Types.CustomerFilter,
    sort : Types.CustomerSort,
    descending : Bool,
    offset : Nat,
    limit : Nat,
  ) : async Types.CustomerPage {
    requireCustomersModule(caller, token);
    CustomersLib.listCustomersPageDir(customersState(), filter, sort, descending, offset, limit);
  };

  public query ({ caller }) func listMotorcyclesPage(
    token : ?Text,
    filter : Types.MotorcycleFilter,
    sort : Types.MotorcycleSort,
    offset : Nat,
    limit : Nat,
  ) : async Types.MotorcyclePage {
    requireMotorcyclesModule(caller, token);
    CustomersLib.listMotorcyclesPage(customersState(), filter, sort, offset, limit);
  };

  public query ({ caller }) func listMotorcyclesPageDir(
    token : ?Text,
    filter : Types.MotorcycleFilter,
    sort : Types.MotorcycleSort,
    descending : Bool,
    offset : Nat,
    limit : Nat,
  ) : async Types.MotorcyclePage {
    requireMotorcyclesModule(caller, token);
    CustomersLib.listMotorcyclesPageDir(customersState(), filter, sort, descending, offset, limit);
  };

  public query ({ caller }) func exportCustomersAggregated(token : ?Text) : async [Types.CustomerExportRow] {
    requireCustomersModule(caller, token);
    CustomersLib.exportCustomersAggregated(customersState());
  };

  public shared ({ caller }) func createMotorcycle(token : ?Text, input : Types.MotorcycleInput) : async Types.Motorcycle {
    requireMotorcyclesModule(caller, token);
    CustomersLib.createMotorcycle(customersState(), input);
  };

  public shared ({ caller }) func updateMotorcycle(token : ?Text, id : Types.Id, input : Types.MotorcycleInput) : async Types.Motorcycle {
    requireMotorcyclesModule(caller, token);
    CustomersLib.updateMotorcycle(customersState(), id, input);
  };

  public shared ({ caller }) func bulkCreateCustomers(token : ?Text, inputs : [Types.CustomerInput]) : async Types.BulkResult {
    requireCustomersModule(caller, token);
    CustomersLib.bulkCreateCustomers(customersState(), inputs);
  };

  public shared ({ caller }) func bulkUpdateCustomers(token : ?Text, updates : [(Types.Id, Types.CustomerInput)]) : async Types.BulkResult {
    requireCustomersModule(caller, token);
    CustomersLib.bulkUpdateCustomers(customersState(), updates);
  };
};
