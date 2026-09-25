import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import AccessControl "mo:caffeineai-authorization/access-control";

import Common "../types/common";
import Types "../types/services";
import ServicesLib "../lib/services";

mixin (
  accessControlState : AccessControl.AccessControlState,
  services : Map.Map<Common.Id, Types.Service>,
  counters : ServicesLib.Counters,
) {
  func servicesState() : ServicesLib.State = { services; counters };

  public query func listServices(filter : Types.ServiceFilter, sort : Types.ServiceSort, offset : Nat, limit : Nat) : async Types.ServicePage {
    ignore (filter, sort, offset, limit);
    ServicesLib.listServices(servicesState(), filter, sort, offset, limit);
  };

  public query func getService(id : Types.Id) : async ?Types.Service {
    ignore id;
    ServicesLib.getService(servicesState(), id);
  };

  public shared func createService(input : Types.ServiceInput) : async Types.Service {
    ignore input;
    ServicesLib.createService(servicesState(), input);
  };

  public shared func updateService(id : Types.Id, input : Types.ServiceInput) : async Types.Service {
    ignore (id, input);
    ServicesLib.updateService(servicesState(), id, input);
  };

  public shared func deleteService(id : Types.Id) : async Bool {
    ignore id;
    ServicesLib.deleteService(servicesState(), id);
  };

  public shared func bulkCreateServices(inputs : [Types.ServiceInput]) : async [Types.Service] {
    ignore inputs;
    ServicesLib.bulkCreateServices(servicesState(), inputs);
  };

  public shared func bulkUpdateServices(updates : [(Types.Id, Types.ServiceInput)]) : async [Types.Service] {
    ignore updates;
    ServicesLib.bulkUpdateServices(servicesState(), updates);
  };

  // Pone el catálogo de servicios de taller en cero. Solo administradores;
  // en caso contrario falla con `notAuthorized`.
  public shared ({ caller }) func zeroServices() : async Types.ZeroServicesResult {
    ignore caller;
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("notAuthorized");
    };
    ServicesLib.zeroServices(servicesState());
  };
};
