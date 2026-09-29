import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import AccessControl "mo:caffeineai-authorization/access-control";

import Common "../types/common";
import Types "../types/services";
import UserTypes "../types/users";
import ServicesLib "../lib/services";
import UsersLib "../lib/users";

mixin (
  accessControlState : AccessControl.AccessControlState,
  services : Map.Map<Common.Id, Types.Service>,
  counters : ServicesLib.Counters,
  credentials : Map.Map<Common.Id, UserTypes.Credential>,
  sessions : Map.Map<Text, UserTypes.Session>,
  roles : Map.Map<Common.Id, UserTypes.Role>,
) {
  func servicesState() : ServicesLib.State = { services; counters };

  func requireServicesModule(caller : Principal, token : ?Text) {
    if (not UsersLib.canAccessModule({ credentials; sessions; roles }, accessControlState, caller, token, "services")) {
      Runtime.trap("Unauthorized: no tiene acceso al módulo de servicios");
    };
  };

  public query ({ caller }) func listServices(token : ?Text, filter : Types.ServiceFilter, sort : Types.ServiceSort, offset : Nat, limit : Nat) : async Types.ServicePage {
    requireServicesModule(caller, token);
    ServicesLib.listServices(servicesState(), filter, sort, offset, limit);
  };

  public query ({ caller }) func getService(token : ?Text, id : Types.Id) : async ?Types.Service {
    requireServicesModule(caller, token);
    ServicesLib.getService(servicesState(), id);
  };

  public shared ({ caller }) func createService(token : ?Text, input : Types.ServiceInput) : async Types.Service {
    requireServicesModule(caller, token);
    ServicesLib.createService(servicesState(), input);
  };

  public shared ({ caller }) func updateService(token : ?Text, id : Types.Id, input : Types.ServiceInput) : async Types.Service {
    requireServicesModule(caller, token);
    ServicesLib.updateService(servicesState(), id, input);
  };

  public shared ({ caller }) func deleteService(token : ?Text, id : Types.Id) : async Bool {
    requireServicesModule(caller, token);
    ServicesLib.deleteService(servicesState(), id);
  };

  public shared ({ caller }) func bulkCreateServices(token : ?Text, inputs : [Types.ServiceInput]) : async [Types.Service] {
    requireServicesModule(caller, token);
    ServicesLib.bulkCreateServices(servicesState(), inputs);
  };

  public shared ({ caller }) func bulkUpdateServices(token : ?Text, updates : [(Types.Id, Types.ServiceInput)]) : async [Types.Service] {
    requireServicesModule(caller, token);
    ServicesLib.bulkUpdateServices(servicesState(), updates);
  };

  // Pone el catálogo de servicios de taller en cero. Solo administradores;
  // en caso contrario falla con `notAuthorized`.
  public shared ({ caller }) func zeroServices(token : ?Text) : async Types.ZeroServicesResult {
    requireServicesModule(caller, token);
    ServicesLib.zeroServices(servicesState());
  };
};
