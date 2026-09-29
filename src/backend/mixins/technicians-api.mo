import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import AccessControl "mo:caffeineai-authorization/access-control";

import Common "../types/common";
import Types "../types/technicians";
import WorkshopTypes "../types/workshop";
import UserTypes "../types/users";
import TechniciansLib "../lib/technicians";
import UsersLib "../lib/users";

mixin (
  accessControlState : AccessControl.AccessControlState,
  technicians : Map.Map<Common.Id, Types.Technician>,
  orders : Map.Map<Common.Id, WorkshopTypes.WorkshopOrder>,
  counters : TechniciansLib.Counters,
  credentials : Map.Map<Common.Id, UserTypes.Credential>,
  sessions : Map.Map<Text, UserTypes.Session>,
  roles : Map.Map<Common.Id, UserTypes.Role>,
) {
  func techniciansState() : TechniciansLib.State = { technicians; orders; counters };

  func requireTechniciansModule(caller : Principal, token : ?Text) {
    if (not UsersLib.canAccessModule({ credentials; sessions; roles }, accessControlState, caller, token, "technicians")) {
      Runtime.trap("Unauthorized: no tiene acceso al módulo de técnicos");
    };
  };

  public query ({ caller }) func listTechnicians(token : ?Text, filter : Types.TechnicianFilter) : async [Types.Technician] {
    requireTechniciansModule(caller, token);
    TechniciansLib.listTechnicians(techniciansState(), filter);
  };

  public query ({ caller }) func getTechnician(token : ?Text, id : Types.Id) : async ?Types.Technician {
    requireTechniciansModule(caller, token);
    TechniciansLib.getTechnician(techniciansState(), id);
  };

  public shared ({ caller }) func createTechnician(token : ?Text, input : Types.TechnicianInput) : async Types.Technician {
    requireTechniciansModule(caller, token);
    TechniciansLib.createTechnician(techniciansState(), input);
  };

  public shared ({ caller }) func updateTechnician(token : ?Text, id : Types.Id, input : Types.TechnicianInput) : async Types.Technician {
    requireTechniciansModule(caller, token);
    TechniciansLib.updateTechnician(techniciansState(), id, input);
  };

  public shared ({ caller }) func deleteTechnician(token : ?Text, id : Types.Id) : async Bool {
    requireTechniciansModule(caller, token);
    TechniciansLib.deleteTechnician(techniciansState(), id);
  };

  public query ({ caller }) func listTechnicianWorkload(token : ?Text) : async [Types.TechnicianWorkload] {
    requireTechniciansModule(caller, token);
    TechniciansLib.listWorkload(techniciansState());
  };

  public query ({ caller }) func getTechnicianWorkload(token : ?Text, technicianId : Types.Id) : async ?Types.TechnicianWorkload {
    requireTechniciansModule(caller, token);
    TechniciansLib.getWorkload(techniciansState(), technicianId);
  };

  public query ({ caller }) func findTechnicianByCode(token : ?Text, code : Text) : async ?Types.Technician {
    requireTechniciansModule(caller, token);
    TechniciansLib.findByCode(techniciansState(), code);
  };
};
